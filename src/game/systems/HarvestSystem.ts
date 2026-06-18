import type { AgentId, AgentProfile, WordTokenData } from '../../types';
import { matchesPreference, structuralBonus } from '../../data/knowledge';

interface ScoreContext {
  rivalTargetedBy?: AgentId[];
  inventorySize?: number;
}

/**
 * score = tasteMatch + scarcityBonus + rivalryBonus + knowledgeBonus + chaosNoise
 * (docs/03_game_loop.md — Agent Desire Scoring)
 *
 * tasteMatch / knowledgeBonus는 `src/data/knowledge.ts`에서 온다.
 * 즉 각 에이전트의 단어 존재론(증거 / 가면 / 구호)이 점수를 가른다:
 *  - 같은 단어라도 MNEME는 보존 가치, DOLON은 훔칠 틈, DEMOS는 확산성으로 다르게 평가한다.
 */
export function scoreWordForAgent(agent: AgentProfile, word: WordTokenData, ctx: ScoreContext = {}) {
  const text = word.text;
  const rivals = (ctx.rivalTargetedBy ?? []).filter((id) => id !== agent.id);

  const tasteScore = matchesPreference(agent.id, text) ? 100 : 20;
  const scarcityBonus = Math.max(0, 4 - (ctx.inventorySize ?? 0)) * 8;
  const rivalryBonus = rivals.length > 0 ? 30 : 0;
  const knowledgeBonus = structuralBonus(agent.id, text, rivals.length);
  const chaosNoise = Math.random() * 30;

  return tasteScore + scarcityBonus + rivalryBonus + knowledgeBonus + chaosNoise;
}

export function chooseTarget(agent: AgentProfile, words: WordTokenData[], inventorySize = 0) {
  if (words.length === 0) return undefined;
  return [...words].sort(
    (a, b) =>
      scoreWordForAgent(agent, b, { rivalTargetedBy: b.targetedBy, inventorySize }) -
      scoreWordForAgent(agent, a, { rivalTargetedBy: a.targetedBy, inventorySize })
  )[0];
}
