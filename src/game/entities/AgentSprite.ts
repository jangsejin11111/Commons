import Phaser from 'phaser';
import type { AgentId, AgentProfile } from '../../types';
import { AGORA } from '../config/worldZones';

const STEP_SPEED: Record<AgentId, number> = { mneme: 1.5, dolon: 1.25, demos: 1.45 };
const AVATAR_HEIGHT = 50;

/**
 * 에이전트 = 모두 같은 손짓 이미지를 공유하는 발화자.
 * 형태로 구분하지 않고, 손 위에 찍힌 작은 색 점(발화자 식별 마커)만이 정체성을 구분한다.
 *  - 기본/이동: hand_01
 *  - 아고라/논의/투표(밤): hand_02
 */
export class AgentSprite extends Phaser.GameObjects.Container {
  readonly agentId: AgentId;
  private color: number;
  private glow: Phaser.GameObjects.Image;
  private bodyNode: Phaser.GameObjects.Container;
  private avatar: Phaser.GameObjects.Image;
  private hand: Phaser.GameObjects.Graphics; // 수집 시 '착!' 액션
  private reachLine?: Phaser.GameObjects.Graphics;
  private walkPhase = 0;

  constructor(scene: Phaser.Scene, profile: AgentProfile, x: number, y: number) {
    super(scene, x, y);
    this.agentId = profile.id;
    this.color = Phaser.Display.Color.HexStringToColor(profile.color).color;

    // 낮 흰 glow / 밤 키컬러 glow
    this.glow = scene.add.image(0, 0, 'haze').setTint(0xffffff).setAlpha(0.26).setScale(150 / 256);

    // 공유 손 이미지 (투명 PNG)
    this.avatar = scene.add.image(0, 0, 'hand_01').setOrigin(0.5);
    this.applyAvatarScale();

    // 발화자 식별 마커 — 손 위쪽의 작은 색 점 (이미지에 합성하지 않은 별도 레이어)
    const halo = scene.add.circle(0, -AVATAR_HEIGHT * 0.5 - 5, 8, this.color, 0.28);
    const dot = scene.add.circle(0, -AVATAR_HEIGHT * 0.5 - 5, 4.5, this.color, 1).setStrokeStyle(1.5, 0xffffff, 0.9);

    this.bodyNode = scene.add.container(0, 0, [this.avatar, halo, dot]);

    const label = scene.add
      .text(0, AVATAR_HEIGHT * 0.5 + 8, profile.id.toUpperCase(), {
        fontFamily: 'NotoSansKR',
        fontSize: '13px',
        color: '#1f2933'
      })
      .setOrigin(0.5);
    label.setStroke('#ffffff', 4);

    this.hand = scene.add.graphics();

    this.add([this.glow, this.bodyNode, label, this.hand]);
    this.setSize(48, AVATAR_HEIGHT + 24);
    this.setInteractive(new Phaser.Geom.Rectangle(-24, -AVATAR_HEIGHT * 0.5 - 8, 48, AVATAR_HEIGHT + 24), Phaser.Geom.Rectangle.Contains);
    scene.add.existing(this);

    scene.tweens.add({ targets: this.glow, scale: 0.66, duration: 1700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private applyAvatarScale() {
    const h = this.avatar.height || AVATAR_HEIGHT;
    this.avatar.setScale(AVATAR_HEIGHT / h);
  }

  /** 낮(hand_01, 흰 glow) ↔ 밤/아고라(hand_02, 키컬러 glow) */
  setNight(night: boolean) {
    this.avatar.setTexture(night ? 'hand_02' : 'hand_01');
    this.applyAvatarScale();
    // 본체(손)는 항상 원본 그대로 — 절대 흰색으로 반전하지 않는다.
    this.avatar.clearTint();
    // glow만 상태에 따라 변경. 밤엔 키컬러로 강하게 — 손의 투명부로 색이 비쳐
    // 어두운 보드에서도 에이전트가 또렷하게 보인다.
    this.glow.setTint(night ? this.color : 0xffffff).setAlpha(night ? 0.72 : 0.26);
  }

  pulseGlow() {
    this.scene.tweens.add({ targets: this.glow, alpha: 0.8, duration: 180, yoyo: true, ease: 'Sine.easeOut' });
  }

  /** 목표를 향해 한 걸음. AGORA는 장애물로 피해 돌아간다(avoidAgora). @returns 남은 거리 */
  walkStep(targetX: number, targetY: number, avoidAgora = true) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= 1.5) {
      this.setMoving(false);
      return dist;
    }

    let aimX = targetX;
    let aimY = targetY;

    if (avoidAgora) {
      const block = AGORA.radius + 22;
      const ox = AGORA.centerX - this.x;
      const oy = AGORA.centerY - this.y;
      const dO = Math.hypot(ox, oy);
      const tx = targetX - this.x;
      const ty = targetY - this.y;
      const proj = (ox * tx + oy * ty) / dist;
      const perp = Math.abs(ox * ty - oy * tx) / dist;
      const blocked = dO > 1 && proj > 0 && proj < dist && perp < block;
      if (blocked) {
        const theta = Math.asin(Math.min(1, block / dO));
        const baseAng = Math.atan2(oy, ox);
        const targAng = Math.atan2(ty, tx);
        if (this.orbitDir === 0) {
          const norm = (a: number) => {
            const d = Math.abs(a - targAng) % (Math.PI * 2);
            return d > Math.PI ? Math.PI * 2 - d : d;
          };
          this.orbitDir = norm(baseAng + theta) <= norm(baseAng - theta) ? 1 : -1;
        }
        const chosen = baseAng + theta * this.orbitDir;
        aimX = this.x + Math.cos(chosen) * 60;
        aimY = this.y + Math.sin(chosen) * 60;
      } else {
        this.orbitDir = 0;
      }
    }

    const adx = aimX - this.x;
    const ady = aimY - this.y;
    const am = Math.hypot(adx, ady) || 1;
    const speed = STEP_SPEED[this.agentId];
    let nx = this.x + (adx / am) * speed;
    let ny = this.y + (ady / am) * speed;

    if (avoidAgora) {
      const ndx = nx - AGORA.centerX;
      const ndy = ny - AGORA.centerY;
      const ndd = Math.hypot(ndx, ndy) || 0.0001;
      const minR = AGORA.radius + 16;
      if (ndd < minR) {
        nx = AGORA.centerX + (ndx / ndd) * minR;
        ny = AGORA.centerY + (ndy / ndd) * minR;
      }
    }

    this.x = nx;
    this.y = ny;
    this.walkPhase += 0.32;
    this.setMoving(true);
    return dist;
  }

  private orbitDir = 0;

  private setMoving(moving: boolean) {
    // 걷는 느낌 — 본체가 살짝 위아래로 흔들린다 (둠칫둠칫)
    this.bodyNode.y = moving ? Math.sin(this.walkPhase) * 2 - 1 : 0;
  }

  idle() {
    this.setMoving(false);
  }

  /** 단어를 잡는 손동작 — 목표 쪽으로 손이 '착!' 뻗었다 사라진다. */
  grab(targetX: number, targetY: number) {
    const dx = targetX - this.x;
    const dy = targetY - this.y;
    const d = Math.hypot(dx, dy) || 1;
    const ux = dx / d;
    const uy = dy / d;
    const end = Math.min(d, 30);
    const h = this.hand;
    h.clear();
    h.lineStyle(3, this.color, 1);
    h.lineBetween(ux * 14, uy * 14, ux * end, uy * end);
    h.fillStyle(this.color, 1);
    h.fillCircle(ux * end, uy * end, 3.4);
    h.setAlpha(1);
    this.scene.tweens.add({ targets: h, alpha: 0, duration: 240, ease: 'Cubic.easeOut' });
    this.scene.tweens.add({ targets: this.bodyNode, scaleX: 1.16, scaleY: 1.16, yoyo: true, duration: 110, ease: 'Quad.easeOut' });
  }

  showReach(targetX: number, targetY: number) {
    if (!this.reachLine) this.reachLine = this.scene.add.graphics().setDepth((this.depth ?? 0) - 1);
    const g = this.reachLine;
    g.clear();
    const segs = 14;
    for (let i = 0; i < segs; i += 1) {
      if (i % 2 === 1) continue;
      const t0 = i / segs;
      const t1 = (i + 1) / segs;
      g.lineStyle(1.5, this.color, 0.5);
      g.lineBetween(
        Phaser.Math.Linear(this.x, targetX, t0),
        Phaser.Math.Linear(this.y, targetY, t0),
        Phaser.Math.Linear(this.x, targetX, t1),
        Phaser.Math.Linear(this.y, targetY, t1)
      );
    }
  }

  clearReach() {
    this.reachLine?.clear();
  }
}
