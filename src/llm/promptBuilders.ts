import type { DebateInput, OfferingInput, VoteInput } from './providers/types';
import { agentProfiles } from '../data/agents';
import type { AgentId } from '../types';
import { getKnowledge, pickModuleForWord } from '../data/knowledge';

export function buildAgentHeader(agentId: string) {
  const profile = agentProfiles.find((agent) => agent.id === agentId);
  if (!profile) throw new Error(`Unknown agent: ${agentId}`);
  return `너는 ${profile.name}, 역할은 ${profile.role}이다. 말투: ${profile.speechStyle}. 글쓰기 성향: ${profile.writingBias}.`;
}

/**
 * knowledge 컨텍스트 — 실제 LLM Provider가 프롬프트에 끼워 넣을 지식 블록.
 * 단어 존재론 + (단어와 가장 잘 맞는) knowledge 모듈의 관점·논리·샘플 발화를 모은다.
 * mockProvider는 이 텍스트 대신 동일한 데이터의 템플릿을 직접 사용한다.
 */
export function buildKnowledgeContext(agentId: AgentId, word?: string) {
  const knowledge = getKnowledge(agentId);
  const module = word ? pickModuleForWord(agentId, word) : knowledge.modules[0];
  const sample = module.sampleUtterances[0] ?? '';
  return [
    `[단어 존재론] ${knowledge.wordOntology}`,
    `[수집 동기] ${knowledge.collectMotive}`,
    `[적용 지식] ${module.title} — 태그: ${module.tags.join(', ')}`,
    `[분쟁 논리] ${module.argumentPatterns.join(' / ')}`,
    `[글쓰기 취향] ${module.writingPatterns.join(' / ')}`,
    sample ? `[샘플 발화] ${sample}` : ''
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildDebatePrompt(input: DebateInput) {
  return [
    buildAgentHeader(input.agentId),
    buildKnowledgeContext(input.agentId, input.disputedWord),
    `분쟁 단어: ${input.disputedWord}`,
    `경쟁자: ${input.contenders.join(', ')}`,
    `너의 보유 단어: ${input.inventory.join(', ') || '없음'}`,
    '너의 지식 체계로 이 단어가 왜 네 것인지 한 문장으로 아고라에서 주장하라.'
  ].join('\n');
}

export function buildVotePrompt(input: VoteInput) {
  return [
    buildAgentHeader(input.agentId),
    buildKnowledgeContext(input.agentId, input.disputedWord),
    `분쟁 단어: ${input.disputedWord}`,
    `토론 로그: ${input.debateLines.map((line) => `${line.agentId}: ${line.line}`).join(' / ')}`,
    '누구에게 투표할지와 이유를 JSON으로 답하라.'
  ].join('\n');
}

export function buildOfferingPrompt(input: OfferingInput) {
  const focusWord = input.inventory[0];
  return [
    buildAgentHeader(input.agentId),
    buildKnowledgeContext(input.agentId, focusWord),
    `현재 봉헌글:\n${input.currentStory || '아직 없음'}`,
    `직전 작성자: ${input.previousAgentId ?? '없음(첫 문단)'}`,
    `너의 보유 단어: ${input.inventory.join(', ') || '없음'}`,
    '너의 지식과 문체를 살려 2~5문장으로 다음 문단을 이어 써라.'
  ].join('\n');
}
