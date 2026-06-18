import Phaser from 'phaser';
import { agentProfiles } from '../../data/agents';
import { useGameStore } from '../../state/useGameStore';
import { AGORA, WORLD_HEIGHT } from '../config/worldZones';
import { AgentSprite } from '../entities/AgentSprite';
import { WordToken } from '../entities/WordToken';
import { chooseTarget } from '../systems/HarvestSystem';
import { runDispute } from '../../world/runDispute';
import { runOffering } from '../../world/runMockOffering';
import type { AgentId, AgentProfile, GamePhase } from '../../types';

const DEPTH = { haze: 0, agora: 1, agoraLabel: 2, word: 5, agent: 10, ui: 50 };

const colorNum = (profile: AgentProfile) =>
  Phaser.Display.Color.HexStringToColor(profile.color).color;

export class MainScene extends Phaser.Scene {
  private agents = new Map<AgentId, AgentSprite>();
  private wordTokens = new Map<string, WordToken>();
  private targetMemory = new Map<AgentId, string>();
  private wanderTargets = new Map<AgentId, { x: number; y: number }>();
  private agoraSlots = new Map<AgentId, { x: number; y: number }>();
  private offeringTriggered = false;
  private agoraRings?: Phaser.GameObjects.Graphics;
  private agoraDisc?: Phaser.GameObjects.Graphics;
  private agoraDots?: Phaser.GameObjects.Graphics;
  private agoraRedGlow?: Phaser.GameObjects.Image;
  private tooltip?: Phaser.GameObjects.Text;
  private lastNight = false;
  private unsubscribe?: () => void;

  constructor() {
    super('MainScene');
  }

  preload() {
    // 모든 에이전트가 공유하는 손짓 이미지 (정적 에셋, 투명 PNG)
    // BASE_URL을 붙여 GitHub Pages 서브경로(/Commons/)에서도 올바르게 로드되게 한다.
    const base = import.meta.env.BASE_URL;
    this.load.image('hand_01', `${base}assets/agents/hand_01.png`); // 기본/이동
    this.load.image('hand_02', `${base}assets/agents/hand_02.png`); // 아고라/논의/투표
  }

  create() {
    this.buildTextures();
    this.drawAgora();
    this.createAgents();
    this.buildTooltip();
    this.unsubscribe = useGameStore.subscribe(() => this.syncWords());
    this.syncWords();
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, this.cleanup, this);
    this.events.once(Phaser.Scenes.Events.DESTROY, this.cleanup, this);
  }

  private cleanup() {
    this.unsubscribe?.();
    this.unsubscribe = undefined;
  }

  update() {
    if (!this.sys || !this.sys.isActive()) return;
    const state = useGameStore.getState();
    this.renderPhase(state.phase);
    this.applyNight(state.phase === 'DISPUTE');

    // 소집(분쟁): AGORA 안쪽 심판장으로 걸어 들어가 모인다 (이때만 진입 허용).
    if (state.phase === 'DISPUTE') {
      for (const profile of agentProfiles) {
        const sprite = this.agents.get(profile.id);
        const slot = this.agoraSlots.get(profile.id);
        if (!sprite) continue;
        sprite.clearReach();
        if (slot) sprite.walkStep(slot.x, slot.y, false);
        else sprite.idle();
      }
      return;
    }

    // 봉헌: 제자리에 선다.
    if (state.phase === 'OFFERING') {
      this.agents.forEach((sprite) => {
        sprite.clearReach();
        sprite.idle();
      });
      return;
    }

    const words = state.words.filter((word) => word.state === 'SPAWNED' || word.state === 'TARGETED');
    const liveById = new Map(words.map((word) => [word.id, word] as const));

    const totalCollected = state.agents.reduce((sum, agent) => sum + agent.inventory.length, 0);
    if (!this.offeringTriggered && words.length === 0 && totalCollected >= 6 && state.offerings.length === 0) {
      this.offeringTriggered = true;
      void runOffering();
      return;
    }

    if (words.length === 0) {
      this.targetMemory.clear();
      this.agents.forEach((sprite, id) => {
        sprite.clearReach();
        this.wander(sprite, id);
      });
      return;
    }

    // 1) sticky 타겟 + 걷기 (AGORA 우회)
    for (const profile of agentProfiles) {
      const sprite = this.agents.get(profile.id);
      if (!sprite) continue;

      let targetId = this.targetMemory.get(profile.id);
      let target = targetId ? liveById.get(targetId) : undefined;
      if (!target) {
        const inv = state.agents.find((a) => a.id === profile.id)?.inventory.length ?? 0;
        target = chooseTarget(profile, words, inv);
        if (!target) continue;
        this.targetMemory.set(profile.id, target.id);
      }
      this.setAgentSeeking(profile.id, target.id);

      const dist = sprite.walkStep(target.x, target.y);
      if (dist < 90) sprite.showReach(target.x, target.y);
      else sprite.clearReach();
    }

    // 2) 분쟁 감지
    const byWord = new Map<string, AgentId[]>();
    for (const [agentId, wordId] of this.targetMemory) {
      if (!liveById.has(wordId)) continue;
      byWord.set(wordId, [...(byWord.get(wordId) ?? []), agentId]);
    }

    for (const [wordId, contenders] of byWord) {
      if (contenders.length < 2) continue;
      const word = liveById.get(wordId)!;
      const someoneClose = contenders.some((id) => {
        const s = this.agents.get(id)!;
        return Phaser.Math.Distance.Between(s.x, s.y, word.x, word.y) < 120;
      });
      if (!someoneClose) continue;

      const dispute = useGameStore.getState().openDispute(wordId, contenders);
      this.agents.forEach((sprite) => sprite.clearReach());
      this.assignAgoraSlots();
      if (dispute) void runDispute(dispute).then(() => this.targetMemory.clear());
      return;
    }

    // 3) 단어 근처 도달 시에만 수확 (+ 손동작·뿅·플로팅 라벨)
    for (const profile of agentProfiles) {
      const targetId = this.targetMemory.get(profile.id);
      if (!targetId) continue;
      if ((byWord.get(targetId)?.length ?? 0) > 1) continue;
      const word = liveById.get(targetId);
      const sprite = this.agents.get(profile.id);
      if (!word || !sprite) continue;

      const distance = Phaser.Math.Distance.Between(sprite.x, sprite.y, word.x, word.y);
      if (distance < 36) {
        const token = this.wordTokens.get(targetId);
        this.wordTokens.delete(targetId); // syncWords가 중복 처리하지 않도록 분리
        sprite.grab(word.x, word.y);
        token?.collectBy(colorNum(profile));
        this.spawnCollectLabel(word.x, word.y, profile);
        useGameStore.getState().claimWord(targetId, profile.id);
        this.targetMemory.delete(profile.id);
        sprite.clearReach();
      }
    }
  }

  // ── visual build ───────────────────────────────────────────────

  private buildTextures() {
    if (!this.textures.exists('haze')) {
      const size = 256;
      const tex = this.textures.createCanvas('haze', size, size);
      const ctx = tex?.getContext();
      if (ctx) {
        const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
        g.addColorStop(0, 'rgba(255,255,255,1)');
        g.addColorStop(0.55, 'rgba(255,255,255,0.55)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, size, size);
        tex?.refresh();
      }
    }
  }

  /** AGORA — 회색 석조 중심 광장(평소 진입 불가한 장애물). 또렷한 링 + 도트 매트릭스. */
  private drawAgora() {
    const { centerX: cx, centerY: cy, radius: r } = AGORA;

    // 차가운 회색 헤이즈로 가장자리 블렌딩
    this.add.image(cx, cy, 'haze').setTint(0x8b929c).setAlpha(0.3).setScale((r * 2.8) / 256).setDepth(DEPTH.haze);

    // 분쟁 시 켜지는 붉은 glow (평소 숨김)
    this.agoraRedGlow = this.add
      .image(cx, cy, 'haze')
      .setTint(0xff3b30)
      .setAlpha(0)
      .setScale((r * 3.2) / 256)
      .setDepth(DEPTH.haze);

    // 솔리드 광장 — 낮: 회색 닫힌 중심 / 밤: 차콜 심판장 (테마 반전)
    this.agoraDisc = this.add.graphics().setDepth(DEPTH.agora);
    this.agoraDots = this.add.graphics().setDepth(DEPTH.agora);
    this.paintAgoraBody(false);

    // 또렷한 링 (분쟁 시 붉게 pulse)
    this.agoraRings = this.add.graphics().setDepth(DEPTH.agora);
    this.paintAgoraRings(1, 0x6b7280);

    // 레벨디자인 힌트: 에이전트가 돌아 다니는 우회 궤도(점선 링)
    const orbit = this.add.graphics().setDepth(DEPTH.haze);
    this.dashedCircle(orbit, cx, cy, r + 40, 0x9ca3af, 0.22);

    this.add
      .text(cx, cy + r + 22, 'AGORA', {
        fontFamily: 'NotoSansKR',
        fontSize: '18px',
        color: '#566070'
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.agoraLabel);

    this.add
      .text(22, WORLD_HEIGHT - 30, 'WORD FIELD', {
        fontFamily: 'NotoSansKR',
        fontSize: '14px',
        color: '#9ca3af'
      })
      .setDepth(DEPTH.agoraLabel);
  }

  private dashedCircle(g: Phaser.GameObjects.Graphics, cx: number, cy: number, radius: number, color: number, alpha: number) {
    g.lineStyle(1.5, color, alpha);
    const dashes = 60;
    for (let i = 0; i < dashes; i += 1) {
      if (i % 2 === 1) continue;
      const a0 = (Math.PI * 2 * i) / dashes;
      const a1 = (Math.PI * 2 * (i + 1)) / dashes;
      g.beginPath();
      g.arc(cx, cy, radius, a0, a1, false);
      g.strokePath();
    }
  }

  /** AGORA 본체(원반+도트) — 낮: 회색 / 밤: 차콜 심판장 */
  private paintAgoraBody(night: boolean) {
    const disc = this.agoraDisc;
    const dots = this.agoraDots;
    if (!disc || !dots) return;
    const { centerX: cx, centerY: cy, radius: r } = AGORA;

    disc.clear();
    if (night) {
      disc.fillStyle(0x1f2937, 1);
      disc.fillCircle(cx, cy, r);
      disc.fillStyle(0x273244, 1);
      disc.fillCircle(cx, cy, r * 0.66);
    } else {
      disc.fillStyle(0xaab1bb, 0.7);
      disc.fillCircle(cx, cy, r);
      disc.fillStyle(0x9aa2ad, 0.5);
      disc.fillCircle(cx, cy, r * 0.66);
    }

    dots.clear();
    dots.fillStyle(night ? 0x8b97a8 : 0x5b6470, night ? 0.7 : 0.6);
    for (let rr = r - 16; rr > 16; rr -= 16) {
      const count = Math.max(6, Math.round((Math.PI * 2 * rr) / 16));
      for (let i = 0; i < count; i += 1) {
        const a = (Math.PI * 2 * i) / count + rr * 0.05;
        dots.fillCircle(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, 1.2);
      }
    }
    dots.fillStyle(night ? 0xff4d4f : 0x3a424d, night ? 1 : 0.9);
    dots.fillCircle(cx, cy, night ? 3.4 : 3);
  }

  private paintAgoraRings(pulse: number, color: number) {
    const rings = this.agoraRings;
    if (!rings) return;
    const { centerX: cx, centerY: cy, radius: r } = AGORA;
    rings.clear();
    rings.lineStyle(2.5, color, 0.9 * pulse);
    rings.strokeCircle(cx, cy, r);
    rings.lineStyle(1.5, color, 0.5 * pulse);
    rings.strokeCircle(cx, cy, r * 0.72);
    rings.strokeCircle(cx, cy, r * 0.46);
    rings.lineStyle(1.5, color, 0.55);
    rings.strokeCircle(cx, cy, r + 9 * pulse);
  }

  private renderPhase(phase: GamePhase) {
    if (phase === 'DISPUTE') {
      // 붉게 활성화되는 심판장: 링 pulse + 붉은 glow
      const pulse = 1 + 0.32 * Math.sin(this.time.now / 160);
      this.paintAgoraRings(pulse, 0xff4d4f);
      this.agoraRedGlow?.setAlpha(0.32 + 0.2 * Math.sin(this.time.now / 200));
    } else {
      this.paintAgoraRings(1, 0x6b7280);
      this.agoraRedGlow?.setAlpha(0);
    }
  }

  private applyNight(night: boolean) {
    if (night === this.lastNight) return;
    this.lastNight = night;
    this.paintAgoraBody(night);
    this.agents.forEach((sprite) => sprite.setNight(night));
  }

  private setAgentSeeking(id: AgentId, targetWordId: string) {
    const agent = useGameStore.getState().agents.find((a) => a.id === id);
    if (agent && agent.state !== 'SEEKING') useGameStore.getState().setAgentState(id, 'SEEKING', targetWordId);
  }

  private wander(sprite: AgentSprite, id: AgentId) {
    let roam = this.wanderTargets.get(id);
    const reached = roam && Phaser.Math.Distance.Between(sprite.x, sprite.y, roam.x, roam.y) < 22;
    if (!roam || reached) {
      const angle = Math.random() * Math.PI * 2;
      const rx = 170 + Math.random() * 200;
      const ry = 150 + Math.random() * 90;
      roam = { x: AGORA.centerX + Math.cos(angle) * rx, y: AGORA.centerY + Math.sin(angle) * ry };
      this.wanderTargets.set(id, roam);
    }
    sprite.walkStep(roam.x, roam.y);
  }

  private createAgents() {
    const layout: Record<AgentId, number> = { mneme: -Math.PI / 2, dolon: Math.PI * 0.72, demos: Math.PI * 0.28 };
    agentProfiles.forEach((profile) => {
      const angle = layout[profile.id];
      const x = AGORA.centerX + Math.cos(angle) * 250;
      const y = AGORA.centerY + Math.sin(angle) * 185;
      const sprite = new AgentSprite(this, profile, x, y);
      sprite.setDepth(DEPTH.agent);
      sprite.on('pointerover', () => this.showTooltip(profile, sprite));
      sprite.on('pointerout', () => this.tooltip?.setVisible(false));
      this.agents.set(profile.id, sprite);
    });
  }

  private buildTooltip() {
    this.tooltip = this.add
      .text(0, 0, '', {
        fontFamily: 'NotoSansKR',
        fontSize: '14px',
        color: '#ffffff',
        backgroundColor: 'rgba(31,41,51,0.92)',
        padding: { x: 10, y: 6 },
        align: 'center'
      })
      .setOrigin(0.5, 1)
      .setDepth(DEPTH.ui)
      .setVisible(false);
  }

  private showTooltip(profile: AgentProfile, sprite: AgentSprite) {
    const agent = useGameStore.getState().agents.find((a) => a.id === profile.id);
    const inv = agent?.inventory.length ? agent.inventory.join(' · ') : '아직 수확 없음';
    this.tooltip?.setText(`${profile.id.toUpperCase()}  ·  ${inv}`).setPosition(sprite.x, sprite.y - 34).setVisible(true);
  }

  /** 누가 수확했는지 — 단어 자리에서 에이전트 색 라벨이 떠오르며 사라진다. */
  private spawnCollectLabel(x: number, y: number, profile: AgentProfile) {
    const label = this.add
      .text(x, y - 18, profile.id.toUpperCase(), {
        fontFamily: 'NotoSansKR',
        fontSize: '14px',
        color: profile.color
      })
      .setOrigin(0.5)
      .setDepth(DEPTH.ui);
    label.setStroke('#ffffff', 4);
    this.tweens.add({
      targets: label,
      y: y - 46,
      alpha: 0,
      duration: 850,
      ease: 'Cubic.easeOut',
      onComplete: () => label.destroy()
    });
  }

  private syncWords() {
    if (!this.sys || !this.sys.isActive()) return;
    const words = useGameStore.getState().words;
    const liveIds = new Set(words.map((word) => word.id));

    for (const [id, token] of this.wordTokens.entries()) {
      if (!liveIds.has(id)) {
        token.dissolve();
        this.wordTokens.delete(id);
      }
    }

    words.forEach((word) => {
      const existing = this.wordTokens.get(word.id);
      if (!existing) {
        const token = new WordToken(this, word);
        token.setDepth(DEPTH.word);
        if (word.state === 'CONTESTED') token.setContested(true);
        this.wordTokens.set(word.id, token);
      } else {
        existing.setContested(word.state === 'CONTESTED');
      }
    });
  }

  private assignAgoraSlots() {
    let i = 0;
    const size = this.agents.size;
    for (const id of this.agents.keys()) {
      const angle = (Math.PI * 2 * i) / size - Math.PI / 2;
      i += 1;
      // 심판장 안쪽으로 모인다 (분쟁 때만 진입)
      this.agoraSlots.set(id, {
        x: AGORA.centerX + Math.cos(angle) * (AGORA.radius * 0.5),
        y: AGORA.centerY + Math.sin(angle) * (AGORA.radius * 0.5)
      });
    }
  }
}
