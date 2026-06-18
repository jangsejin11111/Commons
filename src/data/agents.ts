import type { AgentProfile, AgentRuntimeState } from '../types';
import { preferredWordsOf } from './knowledge';

export const agentProfiles: AgentProfile[] = [
  {
    id: 'mneme',
    name: 'MNEME / 므네메',
    role: '기록관',
    color: '#2aa7a5',
    // 단어 취향은 knowledge에서 파생된다 (단어 = 증거·유물·기록).
    tasteKeywords: preferredWordsOf('mneme'),
    speechStyle: '차분한 고문서 번역체. 출처·맥락·절차를 증거처럼 따진다.',
    writingBias: '앞 문단을 보존·정리하고 출처와 순서를 매겨 문장의 뼈대를 세운다.'
  },
  {
    id: 'dolon',
    name: 'DOLON / 돌론',
    role: '도둑',
    color: '#9b4acb',
    // 단어 = 훔칠 수 있는 가면·이동하는 의미.
    tasteKeywords: preferredWordsOf('dolon'),
    speechStyle: '짧고 비꼬는 말투. 궤변과 은유로 규칙의 빈틈을 찌른다.',
    writingBias: '앞 문장의 의미를 훔쳐 오독·재배열하고 다른 방향으로 비튼다.'
  },
  {
    id: 'demos',
    name: 'DEMOS / 데모스',
    role: '합창 지휘자',
    color: '#d99525',
    // 단어 = 퍼지는 구호·감정 전염 단위.
    tasteKeywords: preferredWordsOf('demos'),
    speechStyle: '구호와 반복이 많고 과반·분위기를 무기로 쓴다. 다정한 척하지만 다수의 폭력을 품었다.',
    writingBias: "'우리'의 목소리로 후렴·반복·합창체를 만들고 장면을 밈처럼 퍼뜨린다."
  }
];

export const initialAgentStates: AgentRuntimeState[] = agentProfiles.map((agent) => ({
  id: agent.id,
  state: 'IDLE',
  inventory: []
}));
