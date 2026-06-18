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

const ROLE_TASK: Record<string, string> = {
  mneme:
    '이 단어가 오래전부터 세계에 있었던 것처럼, 그 단어가 깃든 장소·사물·금기·이름의 기원 장면을 써라.',
  dolon:
    '앞 문단의 장소·사물·이름을 그대로 이어받아, 누군가 그 말을 훔치거나 비틀어 뜻이 변해버린 밤의 사건을 써라.',
  demos:
    '앞 문단에서 변해버린 그 말이 한 사람에서 군중으로, 후렴·소문·의례가 되어 퍼지는 장면을 반복과 리듬으로 써라.'
};

export function buildOfferingPrompt(input: OfferingInput) {
  const focusWord = input.focusWord ?? input.inventory[0];
  return [
    buildAgentHeader(input.agentId),
    buildKnowledgeContext(input.agentId, focusWord),
    `[모드] story_continuation — 너는 하나의 신화/전승을 이어 쓰는 중이다.`,
    `[이 라운드의 씨앗 단어] ${focusWord ?? '(없음)'}`,
    `[지금까지의 이야기]\n${input.currentStory || '(아직 첫 문단)'}`,
    `[너의 차례 과제] ${ROLE_TASK[input.agentId] ?? ''}`,
    [
      '규칙:',
      "- 앞 문단의 장소·사물·반복어를 반드시 이어받아 다음 '장면'을 쓴다.",
      '- 본문에 에이전트 이름이나 역할 설명을 절대 넣지 않는다(이름은 UI 라벨로만).',
      "- '~했다(보고체)', '의미/색인/좌표/데이터/변형' 같은 메타 단어 금지.",
      '- 사물·장소·몸짓·소리·날씨·반복되는 말로 장면을 보여준다. 2~4문장.'
    ].join('\n')
  ].join('\n');
}
