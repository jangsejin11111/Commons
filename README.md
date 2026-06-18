# The Word Commons / 더 워드 커먼즈

인간이 입력한 단어가 AI 에이전트들의 세계에 공급되고, 세 에이전트가 단어를 수확·분쟁·투표·봉헌글 작성으로 이어가는 2D 멀티에이전트 웹 프로토타입 스캐폴드입니다.

이 폴더는 Claude Code에게 통째로 넣고 작업시키기 위한 **프로젝트 헌법 + 캐릭터 성경 + 구현 설계서 + 최소 코드 골격**입니다.

## 추천 스택

- Vite + React + TypeScript: 빠른 웹 프로토타입, UI 패널/입력창/상단 봉헌문 스크린에 적합
- Phaser 3: 2D 월드, 에이전트 이동, 단어 토큰, 손 뻗기 애니메이션, 아고라 집결 같은 게임 루프에 적합
- Zustand: React UI와 Phaser 시뮬레이션 사이의 상태 공유
- LLM Provider Adapter: 지금은 mockProvider로 로컬 시연 가능. 이후 Anthropic/OpenAI/로컬 모델 연결

## 핵심 플레이

1. 인간 유저가 단어를 입력한다.
2. 단어들이 하단의 단어밭에 무작위로 피어난다.
3. 세 에이전트가 각자의 취향과 현재 상태에 따라 단어를 탐낸다.
4. 단어를 집으면 해당 단어는 에이전트의 인벤토리로 들어간다.
5. 한 단어를 두 에이전트 이상이 동시에 탐내면 아고라 절차가 열린다.
6. 세 에이전트가 1분 토론 후 투표한다.
7. 과반수 결정에 따라 단어 소유권이 배정된다.
8. 에이전트들은 순서대로 릴레이 봉헌글을 작성한다.
9. 상단 양피지 스크린에 공동 소설이 실시간으로 누적된다.

## 빠른 시작

```bash
npm install
npm run dev
```

현재 코드는 mock LLM으로 돌아가도록 설계되어 있습니다. 실제 LLM 호출은 `src/llm/providers/` 아래 Provider를 확장하세요.

## 구현 상태 (MVP 완료)

발표용 한 사이클(`수확 → 분쟁 → 아고라 투표 → 릴레이 봉헌글`)이 mock LLM 기반으로 자동 시연됩니다.

- **수확**: 세 에이전트가 취향(`tasteKeywords`) + 희소성 + 경쟁 점수로 목표 단어를 골라 이동·수집. 타겟은 sticky 처리되어 흔들리지 않음.
- **분쟁**: 두 에이전트가 같은 단어를 노리고 한 명이라도 근접하면 `DISPUTE` 진입 → 전원 아고라로 집결.
- **아고라**: `src/world/runDispute.ts`가 토론(순차 타이핑) → 전원 투표 → 과반 집계 → 판결을 자동 진행.
- **봉헌**: 단어밭이 비고 누적 수확 ≥ 6이면 자동, 또는 `봉헌 시작` 버튼으로 수동. MNEME → DOLON → DEMOS 순서로 양피지에 타이핑.
- **상태 흐름**: `phase`(`HARVEST`/`DISPUTE`/`OFFERING`)가 단일 진실원으로 각 루프를 배타적으로 제어.
- **provider 전환**: `src/llm/providers/index.ts`의 `resolveProvider()`가 `VITE_LLM_PROVIDER`를 보고 분기하며, 미구현/키 부재 시 항상 `mockProvider`로 fallback.

## UI / 비주얼 시스템

낡은 양피지 판타지 UI를 버리고 **미니멀 화이트/그레이 + 추상 비트맵 2D 필드** 방향으로 재설계됨.

- **레이아웃**: 상단 봉헌 아카이브(유일한 봉헌지, 내부 스크롤) → (월드맵 + 이벤트 로그) 행 → 입력바. 봉헌지 중복 제거됨.
- **월드맵**: 하이브리드 렌더링 — 필드 텍스처(하프톤 도트·비트맵 그리드·가우시안 블러 헤이즈·그레인)는 `.world-map` CSS가 깔고, 투명 Phaser 캔버스가 그 위에 **중앙 AGORA(동심 링+도트 매트릭스) + 주변 WORD FIELD + 토큰**을 그린다.
- **컴포넌트**: [TopOfferingArchive](src/ui/TopOfferingArchive.tsx)(작성자명 없이 컬러바+민트/보라/주황 잉크로 구분), [EventLogPanel](src/ui/EventLogPanel.tsx), [WordInputBar](src/ui/WordInputBar.tsx).
- **에이전트**: 라운드 그래픽 토큰(키컬러 글로우 + 비트맵 도트 + 라벨) — [AgentSprite](src/game/entities/AgentSprite.ts). 단어는 점 클러스터 + 미니 태그 — [WordToken](src/game/entities/WordToken.ts).
- **폰트**: UI 전반은 `Typo_DonkiPrinceB`, 상단 아카이브의 이야기 본문만 `MiraeroNormal`(둘 다 `public/assets/fonts/`에서 `@font-face` 등록, App에서 프리로드 후 캔버스 생성).
- **색 팔레트**: `src/styles/global.css`의 CSS 변수로 일원화(화이트/그레이/translucent + 에이전트 민트·보라·주황).

## Claude Code에게 줄 첫 명령

`CLAUDE.md`와 `docs/06_implementation_tasks_for_claude.md`를 먼저 읽고, mock LLM 기반 MVP를 완성한 뒤 실제 LLM Provider를 붙일 수 있게 리팩터링하세요.
