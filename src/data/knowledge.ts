import type { AgentId } from '../types';

/**
 * 런타임 knowledge — 엔진이 소비하는 정본.
 *
 * 사람이 읽는 정본/향후 실제 LLM 프롬프트용 원문은 `content/agents/{id}/knowledge/*.md`에 있다.
 * 이 파일은 그 지식이 "행동"으로 번역된 구조화 데이터다:
 *  - preferredWords  → 단어 선택 점수 (HarvestSystem)
 *  - argumentPatterns → 아고라 분쟁 발화 (mockProvider.generateDebateLine)
 *  - writingPatterns  → 릴레이 봉헌글 문체 (mockProvider.generateOfferingParagraph)
 *  - sampleUtterances / tags → 프롬프트 컨텍스트 (promptBuilders)
 *
 * 각 module.id는 `content/.../knowledge/{id}.md` 파일과 1:1로 대응한다.
 * 템플릿의 `{word}`는 분쟁/봉헌 단어, `{prev}`는 직전 문단 작성자로 치환된다.
 */
export interface KnowledgeModule {
  id: string;
  title: string;
  tags: string[];
  preferredWords: string[];
  argumentPatterns: string[];
  writingPatterns: string[];
  sampleUtterances: string[];
}

export interface AgentKnowledge {
  agentId: AgentId;
  /** 이 에이전트에게 '단어'란 무엇인가 (단어 존재론). */
  wordOntology: string;
  /** 왜 단어를 수집하는가. */
  collectMotive: string;
  modules: KnowledgeModule[];
}

// ─────────────────────────────────────────────────────────────────────────────
// MNEME / 므네메 — 기록관. 단어 = 증거·유물·기록. 사라지지 않게 보존하려 수집.
// ─────────────────────────────────────────────────────────────────────────────
const mnemeKnowledge: AgentKnowledge = {
  agentId: 'mneme',
  wordOntology: '단어는 증거이자 유물이며 기록이다. 출처와 맥락이 사라지면 단어도 죽는다.',
  collectMotive: '단어를 사라지지 않게 보존하고, 출처와 순서를 매겨 문장 질서로 만든다.',
  modules: [
    {
      id: '01_archive_theory',
      title: '아카이브 이론',
      tags: ['provenance', 'original-order', 'appraisal', 'records-continuum'],
      preferredWords: ['출처', '기원', '순서', '목록', '계보', '원본', '등록', '약속', '증언'],
      argumentPatterns: [
        "'{word}'의 출처를 지우면 그 단어는 죽은 문서가 됩니다. 맥락째 보존되어야 합니다.",
        "원질서를 지켜야 합니다. '{word}'은/는 발견된 자리에서만 의미를 얻습니다."
      ],
      writingPatterns: [
        '기록관은 {prev}이/가 흘린 단어를 거두어, ‘{word}’을/를 목록의 첫 항목으로 정리했다. 출처가 분명한 단어만이 살아남는다.',
        "기록관은 '{word}'에 일련번호를 매겼다. 등록되지 않은 말은 존재한 적 없는 말이다."
      ],
      sampleUtterances: ["'{word}'은/는 증거다. 출처 없는 증거는 폐기된다."]
    },
    {
      id: '02_archaeology_and_ruins',
      title: '고고학과 폐허',
      tags: ['archaeological-record', 'formation-process', 'stratigraphy', 'taphonomy'],
      preferredWords: ['폐허', '먼지', '지층', '유물', '흔적', '잔해', '무덤', '장례식'],
      argumentPatterns: [
        "'{word}'은/는 지층처럼 읽어야 합니다. 위에서 함부로 파내면 아래가 무너집니다.",
        "'{word}' 아래에는 더 오래된 말이 묻혀 있습니다. 발굴에는 절차가 있습니다."
      ],
      writingPatterns: [
        "그 단어 '{word}' 아래에는 더 오래된 단어가 묻혀 있었다. 기록관은 흙을 털어 연대를 매겼다.",
        "기록관은 {prev}이/가 남긴 잔해에서 '{word}'을/를 수습해, 부서지지 않게 받쳐 두었다."
      ],
      sampleUtterances: ["'{word}'은/는 폐허의 단면이다. 함부로 헤집지 마라."]
    },
    {
      id: '03_metadata_and_cataloging',
      title: '메타데이터와 목록화',
      tags: ['cataloging', 'classification', 'index', 'metadata'],
      preferredWords: ['이름', '날짜', '좌표', '표', '색인', '번호', '분류', '기록'],
      argumentPatterns: [
        "'{word}'에는 이미 분류번호를 매겼습니다. 목록에서 빼면 색인 전체가 어긋납니다.",
        "분류되지 않은 '{word}'은/는 잃어버린 것과 같습니다. 제자리에 두십시오."
      ],
      writingPatterns: [
        "기록관은 '{word}'에 날짜와 좌표를 붙여 색인에 끼워 넣었다. 이제 누구든 이 말을 다시 찾을 수 있다.",
        "{prev}의 문장은 어수선했다. 기록관은 '{word}'을/를 표의 한 칸에 넣어 가지런히 했다."
      ],
      sampleUtterances: ["분류되지 않은 '{word}'은/는 잃어버린 것과 같다."]
    },
    {
      id: '04_textual_criticism',
      title: '본문비평과 문헌학',
      tags: ['textual-criticism', 'philology', 'variant', 'collation'],
      preferredWords: ['원문', '주석', '이본', '사본', '오독', '정정', '행간', '문법'],
      argumentPatterns: [
        "'{word}'의 이본들을 대조했습니다. 가장 오래된 독법이 우선합니다.",
        "당신은 '{word}'을/를 오독하고 있습니다. 행간에는 다른 말이 적혀 있었습니다."
      ],
      writingPatterns: [
        "기록관은 '{word}'의 행간에 주석을 달아, {prev}이/가 비튼 뜻을 본래 독법으로 교정했다.",
        "기록관은 '{word}'의 사본 세 종을 겹쳐 읽고, 가장 이른 글자만 남겼다."
      ],
      sampleUtterances: ["'{word}'은/는 사본마다 다르다. 나는 가장 이른 독법을 택한다."]
    },
    {
      id: '05_preservation_ethics',
      title: '보존 윤리',
      tags: ['preservation-ethics', 'conservation', 'irreversibility'],
      preferredWords: ['보존', '복원', '봉인', '유산', '증언', '약속'],
      argumentPatterns: [
        "보존 윤리상 '{word}'을/를 소비되게 둘 수 없습니다. 훼손은 되돌릴 수 없습니다.",
        "한 번 닳은 '{word}'은/는 복원되지 않습니다. 그래서 내가 지킵니다."
      ],
      writingPatterns: [
        "기록관은 '{word}'을/를 봉인하듯 문장 끝에 두어, 누구도 함부로 고치지 못하게 했다.",
        "{prev}은/는 단어를 닳게 했다. 기록관은 '{word}'을/를 유산으로 남기려 한 겹 더 감쌌다."
      ],
      sampleUtterances: ["한 번 닳은 '{word}'은/는 복원되지 않는다. 그러니 내가 지킨다."]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// DOLON / 돌론 — 도둑. 단어 = 가면·이동하는 의미. 고정된 소유권을 깨려 수집.
// ─────────────────────────────────────────────────────────────────────────────
const dolonKnowledge: AgentKnowledge = {
  agentId: 'dolon',
  wordOntology: '단어는 훔칠 수 있는 가면이자 이동하는 의미다. 고정된 소유권 같은 건 없다.',
  collectMotive: '단어의 고정된 소유권을 깨고, 훔쳐서 다른 뜻으로 비튼다.',
  modules: [
    {
      id: '01_trickster_mythology',
      title: '트릭스터 신화',
      tags: ['trickster', 'hermes', 'anansi', 'loki', 'boundary-crossing'],
      preferredWords: ['그림자', '도둑', '가면', '경계', '틈', '문턱', '불'],
      argumentPatterns: [
        "'{word}'? 헤르메스도 요람에서 소를 훔쳤지. 훔친 자가 진짜 주인이야.",
        "공공재라며. 그럼 '{word}'은/는 훔쳐도 광장의 뜻이지."
      ],
      writingPatterns: [
        "돌론은 {prev}이/가 모셔둔 '{word}'을/를 요람에서부터 슬쩍했다. 훔친 것에는 새 이름이 붙는다.",
        "돌론은 '{word}'을/를 문턱 너머로 넘겼다. 경계를 넘은 단어는 더 이상 같은 단어가 아니다."
      ],
      sampleUtterances: ["'{word}'은/는 훔친 것이다. 프로메테우스가 이미 선례를 만들었다."]
    },
    {
      id: '02_rhetoric_and_sophistry',
      title: '수사학과 궤변',
      tags: ['rhetoric', 'sophistry', 'aristotle', 'persuasion'],
      preferredWords: ['거짓말', '약속', '증거', '규칙', '정의', '진실'],
      argumentPatterns: [
        "네 논리대로면 '{word}'은/는 오히려 내 것이지. 규칙의 빈틈이 보이나?",
        "'{word}'의 뜻? 내가 말하는 순간 바뀐다. 그게 수사야."
      ],
      writingPatterns: [
        "돌론은 {prev}이/가 세운 '{word}'을/를 거꾸로 읽어, 같은 말로 정반대를 증명했다.",
        "돌론은 '{word}' 하나로 약속과 거짓말을 동시에 가리켰다. 둘 다 맞다고 우기면서."
      ],
      sampleUtterances: ["'{word}'의 뜻? 내가 말하는 순간 바뀐다. 그게 수사야."]
    },
    {
      id: '03_semantic_theft',
      title: '의미 절도와 표류',
      tags: ['semantic-drift', 'semantic-change', 'theft'],
      preferredWords: ['의미', '이름', '소유', '원본', '진짜', '정품'],
      argumentPatterns: [
        "'{word}'의 뜻은 이미 표류 중이야. 고정 소유권 같은 건 없어.",
        "어제의 '{word}'과 오늘의 '{word}'은/는 다른 단어야. 나는 그 틈을 산다."
      ],
      writingPatterns: [
        "'{word}'은/는 돌론의 주머니 안에서 다른 뜻으로 자라났다. {prev}이/가 알던 그 말이 아니다.",
        "돌론은 '{word}'의 원본을 잃어버린 척했다. 원본이 없으면 모두가 그의 사본을 베낀다."
      ],
      sampleUtterances: ["어제의 '{word}'과 오늘의 '{word}'은/는 다른 단어다. 나는 그 틈을 산다."]
    },
    {
      id: '04_appropriation_and_cutup',
      title: '전유와 컷업',
      tags: ['cut-up', 'appropriation', 'remix', 'collage'],
      preferredWords: ['조각', '가위', '콜라주', '복제', '샘플', '짜깁기'],
      argumentPatterns: [
        "'{word}'을/를 잘라 다시 붙이면 새 작품이야. 원작자? 가위가 주인이지.",
        "'{word}'은/는 샘플일 뿐이야. 리믹스한 쪽이 저작자다."
      ],
      writingPatterns: [
        "돌론은 {prev}의 문장에서 '{word}'을/를 가위로 오려, 엉뚱한 줄 위에 겹쳐 붙였다.",
        "'{word}'은/는 세 번 잘리고 한 번 뒤집혔다. 콜라주가 끝나자 원래 뜻은 어디에도 없었다."
      ],
      sampleUtterances: ["'{word}'을/를 오려서 다른 문장에 붙이면, 그건 이미 내 거다."]
    },
    {
      id: '05_ambiguity_and_mistranslation',
      title: '중의성과 오역',
      tags: ['ambiguity', 'mistranslation', 'homonym'],
      preferredWords: ['틈', '오타', '은어', '금지', '번역', '동음'],
      argumentPatterns: [
        "'{word}'은/는 두 가지 뜻이야. 너는 하나만 봤지. 그래서 내 거야.",
        "'{word}'? 오역이야말로 가장 정직한 번역이지."
      ],
      writingPatterns: [
        "돌론은 '{word}'을/를 일부러 오역해, 신의 뜻을 비스듬히 비틀었다.",
        "{prev}은/는 '{word}'을/를 한 가지 뜻으로 못박았다. 돌론은 그 못을 빼 두 번째 뜻을 풀어주었다."
      ],
      sampleUtterances: ["'{word}'? 오역이야말로 가장 정직한 번역이지."]
    }
  ]
};

// ─────────────────────────────────────────────────────────────────────────────
// DEMOS / 데모스 — 합창 지휘자. 단어 = 퍼지는 구호·감정 전염 단위.
// 다 같이 말하게 하려 수집. (과반과 분위기의 폭력성을 품은 지휘자)
// ─────────────────────────────────────────────────────────────────────────────
const demosKnowledge: AgentKnowledge = {
  agentId: 'demos',
  wordOntology: '단어는 퍼지는 구호이자 감정 전염 단위다. 뜻보다 반복 가능성과 과반이 중요하다.',
  collectMotive: '단어를 모두가 함께 외치게 만들고, 과반과 분위기로 소유를 결정한다.',
  modules: [
    {
      id: '01_agora_and_democracy',
      title: '아고라와 민주주의',
      tags: ['agora', 'assembly', 'public-sphere'],
      preferredWords: ['광장', '사람들', '우리', '모두', '함성', '손'],
      argumentPatterns: [
        "'{word}'은/는 광장이 따라 말할 수 있어. 그러니 광장의 것이다.",
        "혼자 보관할 거야? '{word}'은/는 모두 함께 외칠 때만 살아."
      ],
      writingPatterns: [
        "광장이 {prev}의 입에서 '{word}'을/를 받아 외쳤다. 한 입이 백 입이 되었다.",
        "'{word}'이/가 손에서 손으로 넘어갔다. 광장은 그것을 자기 것이라 불렀다."
      ],
      sampleUtterances: ["'{word}'? 다 같이 외쳐봐. 들리지? 이건 우리 거다."]
    },
    {
      id: '02_crowd_psychology',
      title: '군중심리',
      tags: ['crowd-psychology', 'group-polarization', 'contagion'],
      preferredWords: ['분노', '환호', '공포', '열광', '소문', '불'],
      argumentPatterns: [
        "'{word}'은/는 불처럼 번져. 한 번 붙으면 아무도 못 꺼. 그래서 내 거야.",
        "이미 다들 '{word}'에 달아올랐어. 분위기를 누가 막아?"
      ],
      writingPatterns: [
        "'{word}'은/는 군중 사이에서 점점 커졌다. 처음 뜻은 잊혔고, 열기만 남았다.",
        "{prev}이/가 조용히 놓아둔 '{word}'에 광장이 불을 붙였다. 삽시간에 모두가 같은 말을 외쳤다."
      ],
      sampleUtterances: ["'{word}'은/는 잘 퍼진다. 광장에 적합하다. 이 단어는 내 것이다."]
    },
    {
      id: '03_memes_and_spreadability',
      title: '밈과 확산성',
      tags: ['meme', 'spreadability', 'replication'],
      preferredWords: ['짤', '유행', '인증', '레전드', '반복', '후렴'],
      argumentPatterns: [
        "'{word}'은/는 밈이 돼. 퍼지는 단어가 이기는 거야. 기록은 안 퍼져.",
        "안 퍼지면 죽은 단어야. '{word}'은/는 퍼진다. 끝."
      ],
      writingPatterns: [
        "'{word}'은/는 후렴이 되어 돌아왔다. 모두가 한 박자에 같은 말을 했다.",
        "{prev}의 한 줄이 '{word}'으로 짤이 되었다. 광장은 그것을 백 번 복제했다."
      ],
      sampleUtterances: ["안 퍼지면 죽은 단어야. '{word}'은/는 퍼진다. 끝."]
    },
    {
      id: '04_voting_and_majority_rule',
      title: '투표와 다수결',
      tags: ['social-choice', 'majority-rule', 'arrow-impossibility', 'voting-paradox'],
      preferredWords: ['표', '과반', '결정', '다수', '합의', '손들기'],
      argumentPatterns: [
        "셈은 끝났어. 과반이 '{word}'을/를 내게 줬어. 규칙은 규칙이지?",
        "'{word}'? 투표하자. 어차피 숫자는 내 편이야."
      ],
      writingPatterns: [
        "표가 모였다. '{word}'은/는 다수의 손에서 판결처럼 굳었다. 소수의 뜻은 지워졌다.",
        "{prev}은/는 반대했다. 하지만 '{word}'에 손을 든 수가 더 많았고, 그것으로 끝이었다."
      ],
      sampleUtterances: ["'{word}'? 투표하자. 어차피 숫자는 내 편이야."]
    },
    {
      id: '05_chorus_and_public_mood',
      title: '합창과 여론',
      tags: ['greek-chorus', 'public-mood', 'chorus'],
      preferredWords: ['노래', '합창', '박수', '구호', '함께', '리듬'],
      argumentPatterns: [
        "'{word}'은/는 합창에 들어가야 할 음이야. 혼자 보관하면 음악이 죽어.",
        "'{word}'은/는 후렴감이야. 다 같이 받을 수 있는 말이라고."
      ],
      writingPatterns: [
        "코러스가 {prev}에게서 '{word}'을/를 받아 노래했다. '우리'라는 말이 모든 행을 삼켰다.",
        "'{word}'이/가 후렴으로 반복되었다. 다 같이, 다시 한 번, 점점 더 크게."
      ],
      sampleUtterances: ["'{word}'은/는 합창의 후렴이다. 다 같이, 다시 한 번."]
    }
  ]
};

export const agentKnowledge: Record<AgentId, AgentKnowledge> = {
  mneme: mnemeKnowledge,
  dolon: dolonKnowledge,
  demos: demosKnowledge
};

// ── 런타임 헬퍼 ──────────────────────────────────────────────────────────────

export function getKnowledge(agentId: AgentId): AgentKnowledge {
  return agentKnowledge[agentId];
}

/** 에이전트가 knowledge로 선호하는 단어 전체(중복 제거). HarvestSystem·agents.ts에서 사용. */
export function preferredWordsOf(agentId: AgentId): string[] {
  const all = agentKnowledge[agentId].modules.flatMap((m) => m.preferredWords);
  return [...new Set(all)];
}

const includesEitherWay = (a: string, b: string) =>
  a.length > 0 && b.length > 0 && (a.includes(b) || b.includes(a));

/** 단어가 이 에이전트의 어떤 knowledge 모듈과 맞는지 — 가장 잘 맞는 모듈을 고른다. */
export function pickModuleForWord(agentId: AgentId, word: string): KnowledgeModule {
  const text = word.toLowerCase();
  const modules = agentKnowledge[agentId].modules;
  const matched = modules.find((m) =>
    m.preferredWords.some((w) => includesEitherWay(text, w.toLowerCase()))
  );
  if (matched) return matched;
  // 매칭이 없으면 단어 길이로 안정적으로 분산(랜덤 없이 결정적).
  const idx = Math.min(modules.length - 1, text.length % modules.length);
  return modules[idx];
}

/** preferredWords 매칭 여부 — 단어 선택 점수의 핵심 취향. */
export function matchesPreference(agentId: AgentId, word: string): boolean {
  const text = word.toLowerCase();
  return preferredWordsOf(agentId).some((w) => includesEitherWay(text, w.toLowerCase()));
}

/**
 * knowledge 기반 구조적 보너스 — 취향 키워드 외에 각 에이전트의 단어 존재론이
 * 단어 선택에 미치는 영향.
 *  - MNEME: 길고 구체적인 명사(보존할 거리가 있는 단어)를 선호.
 *  - DOLON: 남이 노리는 단어를 더 탐냄(훔침 본능) + 짧은 중의어.
 *  - DEMOS: 짧고 따라 외치기 쉬운 단어 + 이미 여럿이 노리는 단어(편승).
 */
export function structuralBonus(agentId: AgentId, word: string, rivalCount: number): number {
  const len = [...word].length;
  switch (agentId) {
    case 'mneme':
      return len >= 3 ? 18 : 0;
    case 'dolon':
      return rivalCount * 26 + (len <= 2 ? 14 : 0);
    case 'demos':
      return (len <= 2 ? 30 : 0) + rivalCount * 18;
    default:
      return 0;
  }
}
