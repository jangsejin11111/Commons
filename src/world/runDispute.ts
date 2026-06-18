import { agentProfiles } from '../data/agents';
import { llmProvider } from '../llm/providers';
import { createFallbackVote, tallyVotes } from '../game/systems/AgoraSystem';
import { useGameStore } from '../state/useGameStore';
import type { AgentId, Dispute } from '../types';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

// 시연용 타이밍. 최종 버전은 docs/03 기준 60초까지 늘릴 수 있다.
const DEBATE_LINE_DELAY = 1100;
const VOTE_DELAY = 800;

const allAgentIds = agentProfiles.map((p) => p.id);

/**
 * 분쟁 한 건의 전체 절차를 진행한다.
 * 토론(순차 타이핑) → 투표 → 과반 집계 → 판결.
 * store.openDispute 가 이미 phase 를 'DISPUTE' 로 바꾼 뒤 호출되며,
 * resolveDispute 가 phase 를 'HARVEST' 로 되돌린다.
 */
export async function runDispute(dispute: Dispute) {
  const { id: disputeId, wordText, contenders } = dispute;

  // 1) 토론: 분쟁 당사자들이 한 줄씩 주장한다.
  for (const agentId of contenders) {
    const agent = useGameStore.getState().agents.find((a) => a.id === agentId);
    const line = await llmProvider.generateDebateLine({
      agentId,
      disputedWord: wordText,
      contenders,
      inventory: agent?.inventory ?? []
    });
    useGameStore.getState().addDebateLine(disputeId, line);
    await wait(DEBATE_LINE_DELAY);
  }

  // 2) 투표: 세 에이전트 전원이 투표한다.
  for (const agentId of allAgentIds) {
    const current = useGameStore.getState().disputes.find((d) => d.id === disputeId);
    let vote;
    try {
      vote = await llmProvider.generateVote({
        agentId,
        disputedWord: wordText,
        contenders,
        debateLines: current?.debateLines ?? []
      });
    } catch {
      vote = createFallbackVote(agentId, contenders);
    }
    // 비당사자가 당사자 아닌 곳에 투표하지 않도록 보정.
    if (!contenders.includes(vote.voteFor)) {
      vote = { ...vote, voteFor: contenders[0] as AgentId };
    }
    useGameStore.getState().addVote(disputeId, vote);
    await wait(VOTE_DELAY);
  }

  // 3) 집계 후 판결.
  const resolved = useGameStore.getState().disputes.find((d) => d.id === disputeId) ?? dispute;
  const winner = tallyVotes(resolved) ?? contenders[0];
  await wait(400);
  useGameStore.getState().resolveDispute(disputeId, winner);

  return winner;
}
