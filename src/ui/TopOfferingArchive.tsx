import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useGameStore } from '../state/useGameStore';

/**
 * 봉헌 양피지 — 유일한 봉헌지. 에이전트들이 쌓는 서사 아카이브 피드.
 * 작성자 이름은 쓰지 않고, 좌측 컬러바 + 글자색(민트/보라/주황)으로만 구분한다.
 * 내용이 길어지면 이 박스 내부만 스크롤된다.
 */
export function TopOfferingArchive() {
  const offerings = useGameStore((state) => state.offerings);
  const [typedCount, setTypedCount] = useState(0);
  const lastRef = useRef('');
  const feedRef = useRef<HTMLDivElement | null>(null);

  const latest = offerings.at(-1);

  // 최신 문단을 한 글자씩 타이핑.
  useEffect(() => {
    if (!latest) return;
    if (lastRef.current === latest.id) return;
    lastRef.current = latest.id;
    setTypedCount(0);
    const full = latest.text;
    let i = 0;
    const timer = setInterval(() => {
      i += 2;
      setTypedCount(i);
      if (i >= full.length) clearInterval(timer);
    }, 22);
    return () => clearInterval(timer);
  }, [latest]);

  // 새 문단이 추가되거나 타이핑될 때 피드를 아래로.
  useLayoutEffect(() => {
    const el = feedRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [offerings.length, typedCount]);

  return (
    <section className="panel offering-archive">
      <div className="offering-archive__head">
        <h1 className="offering-archive__title">THE WORD COMMONS</h1>
        <span className="offering-archive__subtitle">OFFERING PARCHMENT</span>
      </div>
      <div className="offering-archive__feed" ref={feedRef}>
        {offerings.length === 0 && (
          <p className="story-empty">
            신이 아직 말하지 않았다. 단어밭은 비어 있고, 세 에이전트는 서로의 침묵을 의심한다.
          </p>
        )}
        {offerings.map((paragraph) => {
          const isLatest = paragraph.id === latest?.id;
          const shown = isLatest ? paragraph.text.slice(0, typedCount) : paragraph.text;
          const typing = isLatest && typedCount < paragraph.text.length;
          return (
            <div key={paragraph.id} className={`story-block fade-in agent-${paragraph.agentId}`}>
              <p className="story-block__text">
                {shown}
                {typing && <span className="caret">▍</span>}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
