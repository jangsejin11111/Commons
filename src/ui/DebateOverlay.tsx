import type { CSSProperties } from 'react';
import { useGameStore } from '../state/useGameStore';
import { agentProfiles } from '../data/agents';
import type { AgentId, Dispute } from '../types';

const colorOf = (id: AgentId) => agentProfiles.find((p) => p.id === id)?.color ?? '#777';

const STAGE_LABEL: Record<Dispute['status'], string> = {
  OPEN: '분쟁 발생',
  DEBATING: '논의 중',
  VOTING: '투표 중',
  RESOLVED: '판결 완료'
};

/**
 * 토론 기록 — 분쟁/논의/투표 상태에서만 맵 오른쪽 세로 컬럼으로 등장한다.
 * "채팅창 + 토론 기록지 + 양피지 문서"가 섞인 보조 기록창. 중앙 AGORA는 가리지 않는다.
 */
export function DebateOverlay() {
  const phase = useGameStore((state) => state.phase);
  const disputes = useGameStore((state) => state.disputes);
  const active = disputes.find((d) => d.status !== 'RESOLVED');

  if (phase !== 'DISPUTE' || !active) return null;

  return (
    <aside className="discussion-side-panel">
      <header className="discussion__head">
        <div className="discussion__titlerow">
          <span className="discussion__title">토론 기록</span>
          <span className="discussion__word">✧ {active.wordText}</span>
        </div>
        <div className="discussion__status">
          <span className="discussion__status-dot" />
          {STAGE_LABEL[active.status]}
        </div>
        <div className="discussion__contenders">{active.contenders.map((c) => c.toUpperCase()).join(' · ')}</div>
      </header>

      <div className="discussion__body">
        {active.debateLines.map((line, i) => (
          <div key={i} className="msg" style={{ ['--c']: colorOf(line.agentId) } as CSSProperties}>
            <div className="msg__name">{line.agentId.toUpperCase()}</div>
            <p className="msg__text">{line.line}</p>
          </div>
        ))}

        {active.votes.map((vote, i) => (
          <div key={`v${i}`} className="sys-msg">
            {vote.agentId.toUpperCase()}가 {vote.voteFor.toUpperCase()}에게 표를 던졌습니다.
          </div>
        ))}
      </div>
    </aside>
  );
}
