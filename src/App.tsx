import { useEffect, useRef, useState } from 'react';
import type Phaser from 'phaser';
import { createWordCommonsGame } from './game/WordCommonsGame';
import { TopOfferingArchive } from './ui/TopOfferingArchive';
import { WordInputBar } from './ui/WordInputBar';
import { DebateOverlay } from './ui/DebateOverlay';
import { useGameStore } from './state/useGameStore';

export function App() {
  const gameParentRef = useRef<HTMLDivElement | null>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const phase = useGameStore((state) => state.phase);
  const isNight = phase === 'DISPUTE'; // 광장 소집/논의/투표 = 밤 모드

  // 폰트가 로드된 뒤에 Phaser를 띄워야 캔버스 텍스트가 올바른 글꼴로 그려진다.
  useEffect(() => {
    let cancelled = false;
    const fonts = (document as Document & { fonts?: FontFaceSet }).fonts;
    if (!fonts) {
      setFontsReady(true);
      return;
    }
    Promise.all([
      fonts.load('16px NotoSansKR'),
      fonts.load('16px MiraeroNormal')
    ])
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setFontsReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!fontsReady || !gameParentRef.current) return;
    const game = createWordCommonsGame(gameParentRef.current);
    gameRef.current = game;
    return () => {
      gameRef.current = null;
      game.destroy(true);
    };
  }, [fontsReady]);

  // conflict 진입/이탈로 맵 컬럼 폭이 바뀌면 Phaser 캔버스를 새 폭에 다시 맞춘다.
  useEffect(() => {
    const game = gameRef.current;
    if (!game) return;
    const refit = () => game.scale.refresh();
    const r = requestAnimationFrame(refit);
    const t = window.setTimeout(refit, 80);
    return () => {
      cancelAnimationFrame(r);
      clearTimeout(t);
    };
  }, [isNight]);

  return (
    <div className={`app-root${isNight ? ' is-conflict-mode' : ''}`}>
      <div className="wallpaper-layer" />
      <div className="wallpaper-veil" />
      <main className="app-shell">
        <TopOfferingArchive />
        <div className="map-wrap">
          <div ref={gameParentRef} className="world-map" />
          <DebateOverlay />
        </div>
        <WordInputBar />
      </main>
    </div>
  );
}
