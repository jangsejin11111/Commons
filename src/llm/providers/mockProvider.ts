import type { LLMProvider } from './types';
import type { AgentId } from '../../types';
import { getKnowledge, pickModuleForWord, pickMythScene } from '../../data/knowledge';

/**
 * mockProvider — 실제 LLM 없이도 각 에이전트의 knowledge 차이가 드러나도록
 * `src/data/knowledge.ts`의 템플릿(argumentPatterns / writingPatterns)을 사용한다.
 * 같은 단어라도 세 에이전트가 서로 다른 지식 체계로 다르게 말한다.
 */

const SHORT_NAME: Record<AgentId, string> = {
  mneme: '기록관',
  dolon: '도둑',
  demos: '광장'
};

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;

const lastHangulCode = (s: string): number | null => {
  for (let i = s.length - 1; i >= 0; i -= 1) {
    const c = s.charCodeAt(i);
    if (c >= HANGUL_START && c <= HANGUL_END) return c;
  }
  return null;
};

/**
 * 템플릿이 남긴 '을/를', '은/는', '이/가', '와/과', '으로/로' 같은 한국어 조사를
 * 앞 음절의 받침에 맞춰 자동으로 고른다. (mock 출력이 양피지에 그대로 노출되므로)
 */
function resolveJosa(text: string): string {
  return text.replace(/(을\/를|은\/는|이\/가|와\/과|과\/와|으로\/로|이라\/라)/g, (marker, _p, offset: number) => {
    const code = lastHangulCode(text.slice(0, offset));
    if (code === null) return marker;
    const jong = (code - HANGUL_START) % 28;
    const hasBatchim = jong !== 0;
    switch (marker) {
      case '을/를': return hasBatchim ? '을' : '를';
      case '은/는': return hasBatchim ? '은' : '는';
      case '이/가': return hasBatchim ? '이' : '가';
      case '와/과':
      case '과/와': return hasBatchim ? '과' : '와';
      case '으로/로': return !hasBatchim || jong === 8 /* ㄹ */ ? '로' : '으로';
      case '이라/라': return hasBatchim ? '이라' : '라';
      default: return marker;
    }
  });
}

const fill = (tpl: string, word: string, prev?: AgentId) =>
  resolveJosa(tpl.replaceAll('{word}', word).replaceAll('{prev}', prev ? SHORT_NAME[prev] : '신'));

// 단어에 따라 결정적으로 패턴을 골라(랜덤 없이) 같은 입력이면 같은 결과가 나오게 한다.
const pickIndex = (word: string, length: number) => (length > 0 ? [...word].length % length : 0);

export const mockProvider: LLMProvider = {
  async generateDebateLine(input) {
    const module = pickModuleForWord(input.agentId, input.disputedWord);
    const tpl = module.argumentPatterns[pickIndex(input.disputedWord, module.argumentPatterns.length)];
    return { agentId: input.agentId, line: fill(tpl, input.disputedWord) };
  },

  async generateVote(input) {
    const voteFor = input.contenders.includes(input.agentId) ? input.agentId : input.contenders[0];
    const knowledge = getKnowledge(input.agentId);
    const module = pickModuleForWord(input.agentId, input.disputedWord);
    // 투표 이유에 자기 단어 존재론 + 해당 지식 영역을 드러낸다.
    const reason = `${module.title}의 관점에서, ${knowledge.wordOntology}`;
    return { agentId: input.agentId, voteFor, reason };
  },

  async generateOfferingParagraph(input) {
    // 한 라운드는 하나의 seed 단어 + 하나의 공유 장면으로, 세 에이전트가 신화를 이어 쓴다.
    // (요약/처리보고가 아니라 세계 안의 '장면'. 본문에 에이전트 이름은 넣지 않는다.)
    const word = input.focusWord ?? input.inventory[0] ?? '침묵';
    const scene = pickMythScene(input.roundSeed ?? 0);
    const tpl = scene[input.agentId]; // mneme=기원 / dolon=절도·왜곡 / demos=군중 확산
    return {
      agentId: input.agentId,
      usedWords: [word],
      text: fill(tpl, word)
    };
  }
};
