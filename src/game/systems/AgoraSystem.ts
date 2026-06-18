import type { AgentId, Dispute, VoteDecision } from '../../types';

export function tallyVotes(dispute: Dispute): AgentId | undefined {
  const counts = new Map<AgentId, number>();
  dispute.votes.forEach((vote) => counts.set(vote.voteFor, (counts.get(vote.voteFor) ?? 0) + 1));
  let winner: AgentId | undefined;
  let top = 0;
  counts.forEach((count, agentId) => {
    if (count > top) {
      top = count;
      winner = agentId;
    }
  });
  if (top >= 2) return winner;
  return 'demos';
}

export function createFallbackVote(agentId: AgentId, contenders: AgentId[]): VoteDecision {
  const voteFor = contenders.includes(agentId) ? agentId : contenders[0] ?? 'demos';
  return { agentId, voteFor, reason: '광장의 임시 질서가 그렇게 기울었습니다.' };
}
