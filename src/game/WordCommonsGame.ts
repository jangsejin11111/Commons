import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';
import { WORLD_HEIGHT, WORLD_WIDTH } from './config/worldZones';

export function createWordCommonsGame(parent: HTMLElement) {
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    // 고정 논리 해상도. 모든 좌표(zones/agents/words)가 이 좌표계 기준이다.
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    // 캔버스는 투명. 추상 비트맵 필드 텍스처는 CSS(.world-map)가 깔고,
    // Phaser는 그 위에 아고라·토큰·컬러 헤이즈만 그린다.
    transparent: true,
    scene: [MainScene],
    physics: {
      default: 'arcade',
      arcade: { debug: false }
    },
    scale: {
      // FIT: 부모 폭에 맞춰 비율을 유지하며 축소/확대. RESIZE는 flex 컨테이너에서
      // 캔버스 높이가 무한히 늘어나는 피드백 루프를 만들어 사용하지 않는다.
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH
    }
  });
  if (import.meta.env.DEV) (window as unknown as { __game: Phaser.Game }).__game = game;
  return game;
}
