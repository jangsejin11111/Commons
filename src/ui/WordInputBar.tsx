import { FormEvent, useState } from 'react';
import { useGameStore } from '../state/useGameStore';
import { runOffering } from '../world/runMockOffering';

function parseWords(raw: string) {
  return raw.split(/[\s,，、\n]+/).map((word) => word.trim()).filter(Boolean);
}

/* inline icons (stroke = currentColor) */
const IconDrop = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v12" />
    <path d="m7 11 5 5 5-5" />
    <path d="M5 21h14" />
  </svg>
);
const IconOffer = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
    <circle cx="12" cy="12" r="3.4" />
  </svg>
);
const IconReset = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 12a9 9 0 1 0 3-6.7" />
    <path d="M3 4v4h4" />
  </svg>
);

export function WordInputBar() {
  const [value, setValue] = useState('기억, 거짓말, 광장, 그림자, 불, 함성');
  const addWords = useGameStore((state) => state.addWords);
  const reset = useGameStore((state) => state.reset);
  const phase = useGameStore((state) => state.phase);
  const offeringInProgress = useGameStore((state) => state.offeringInProgress);

  const busy = phase !== 'HARVEST' || offeringInProgress;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const words = parseWords(value);
    if (words.length === 0) return;
    addWords(words);
    setValue('');
  };

  return (
    <form className="panel input-bar" onSubmit={handleSubmit}>
      <input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="신의 단어를 내리세요"
      />
      <button className="icon-btn" type="submit" disabled={busy} aria-label="단어 내리기" data-tip="단어 내리기">
        <IconDrop />
      </button>
      <button
        className="icon-btn icon-btn--offering"
        type="button"
        onClick={() => void runOffering()}
        disabled={busy}
        aria-label="봉헌 시작"
        data-tip="봉헌 시작"
      >
        <IconOffer />
      </button>
      <button className="icon-btn" type="button" onClick={() => reset()} aria-label="리셋" data-tip="리셋">
        <IconReset />
      </button>
    </form>
  );
}
