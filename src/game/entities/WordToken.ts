import Phaser from 'phaser';
import type { WordTokenData } from '../../types';

const NEUTRAL = 0x9ca3af;
const CONTEST = 0xef4444;

/**
 * 단어 = 농경지 오브젝트가 아니라, 점으로 번지는 비트맵 클러스터 + 작은 캡션 태그.
 * 생성 시 점이 차오르듯 나타나고, 수확/판결 시 흩어지며 사라진다.
 */
export class WordToken extends Phaser.GameObjects.Container {
  readonly wordId: string;
  readonly textValue: string;
  private cluster: Phaser.GameObjects.Graphics;
  private tagBg: Phaser.GameObjects.Graphics;
  private dotSpots: { x: number; y: number; r: number; a: number }[] = [];
  private tagWidth: number;
  private contested = false;

  constructor(scene: Phaser.Scene, data: WordTokenData) {
    super(scene, data.x, data.y);
    this.wordId = data.id;
    this.textValue = data.text;

    // 점 클러스터 (halftone patch)
    this.cluster = scene.add.graphics();
    const count = 16;
    for (let i = 0; i < count; i += 1) {
      const a = Math.random() * Math.PI * 2;
      const rad = Math.random() * 24;
      this.dotSpots.push({
        x: Math.cos(a) * rad,
        y: Math.sin(a) * rad * 0.7,
        r: 1 + Math.random() * 1.6,
        a: 0.12 + Math.random() * 0.3
      });
    }
    this.drawCluster(NEUTRAL);

    // 캡션 태그
    const text = scene.add
      .text(0, 0, data.text, {
        fontFamily: 'NotoSansKR',
        fontSize: '14px',
        color: '#1f2933'
      })
      .setOrigin(0.5);
    this.tagWidth = Math.max(44, text.width + 18);
    this.tagBg = scene.add.graphics();
    this.drawTag(0xffffff, 0.85);

    this.add([this.cluster, this.tagBg, text]);
    scene.add.existing(this);

    // 점이 차오르며 등장
    this.setScale(0.7);
    this.setAlpha(0);
    scene.tweens.add({ targets: this, scale: 1, alpha: 1, duration: 320, ease: 'Cubic.easeOut' });
  }

  private drawCluster(color: number) {
    this.cluster.clear();
    for (const s of this.dotSpots) {
      this.cluster.fillStyle(color, s.a);
      this.cluster.fillCircle(s.x, s.y, s.r);
    }
  }

  private drawTag(fill: number, alpha: number) {
    const w = this.tagWidth;
    const h = 26;
    this.tagBg.clear();
    this.tagBg.fillStyle(fill, alpha);
    this.tagBg.fillRect(-w / 2, -h / 2, w, h);
    this.tagBg.lineStyle(1, this.contested ? CONTEST : 0xc7ccd2, this.contested ? 0.95 : 0.8);
    this.tagBg.strokeRect(-w / 2, -h / 2, w, h);
  }

  setContested(value: boolean) {
    if (value === this.contested) return;
    this.contested = value;
    this.drawCluster(value ? CONTEST : NEUTRAL);
    this.drawTag(value ? 0xfff1f1 : 0xffffff, value ? 0.92 : 0.85);
    if (value) {
      this.scene.tweens.add({ targets: this, scale: 1.12, yoyo: true, duration: 220, repeat: 2, ease: 'Sine.easeInOut' });
    }
  }

  /** 특정 에이전트가 수확 — 그 색으로 잠깐 강조된 뒤 '뿅' 튀며 사라진다. */
  collectBy(color: number) {
    this.contested = false;
    this.drawCluster(color);
    this.drawTag(0xffffff, 0.95);
    this.tagBg.lineStyle(2, color, 1);
    const w = this.tagWidth;
    this.tagBg.strokeRect(-w / 2, -13, w, 26);
    this.scene.tweens.add({
      targets: this,
      scale: 1.3,
      alpha: 0,
      duration: 280,
      ease: 'Back.easeIn',
      onComplete: () => this.destroy()
    });
  }

  /** 흩어지며 사라진 뒤 파괴 */
  dissolve() {
    this.scene.tweens.add({
      targets: this,
      scale: 0.6,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.easeIn',
      onComplete: () => this.destroy()
    });
  }
}
