# Claude Code Build Instructions — The Word Commons

너는 이 저장소를 기반으로 `<The Word Commons / 더 워드 커먼즈>`라는 2D 웹 프로토타입을 구현한다.

## 프로젝트 한 줄

인간 유저가 던진 단어를 세 AI 에이전트가 수확하고, 소유권 분쟁을 아고라 민주주의로 해결하며, 그 단어들로 신에게 바치는 릴레이 봉헌소설을 실시간으로 작성하는 멀티에이전트 시뮬레이션.

## 반드시 먼저 읽을 문서

1. `docs/00_project_manifest.md`
2. `docs/01_technical_stack.md`
3. `docs/02_world_rules.md`
4. `docs/03_game_loop.md`
5. `docs/04_llm_pipeline.md`
6. `docs/06_implementation_tasks_for_claude.md`
7. `content/agents/*/character.md`
8. `content/world/*.md`

## 구현 우선순위

### MVP 1 — 로컬 시뮬레이션

- Vite + React + TypeScript 앱 실행
- Phaser 월드 생성
- 상단: 양피지 봉헌글 스크린
- 중앙: 아고라 원형 공간
- 하단: 단어밭
- 세 에이전트가 색깔 있는 네모박스로 움직임
- 단어 입력 시 하단 랜덤 위치에 단어 토큰 생성
- 에이전트가 단어를 향해 이동하고 손/갈고리/광선 같은 선을 뻗어 수집
- 수집된 단어는 토큰에서 사라지고, 에이전트 hover 시 인벤토리 표시
- mock LLM으로 각 에이전트 릴레이 글짓기

### MVP 2 — 아고라 절차

- 두 에이전트 이상이 같은 단어를 동시에 탐내면 `DISPUTE` 상태 진입
- 모든 에이전트가 아고라로 이동
- 60초 토론 로그 생성. 개발 중에는 15초로 단축해도 됨.
- 각 에이전트가 주장과 투표를 생성
- 과반수로 소유권 결정
- 결정 로그를 UI에 표시

### MVP 3 — 실제 LLM 연결 준비

- `src/llm/providers/mockProvider.ts`를 유지
- `src/llm/providers/llmProvider.contract.ts` 또는 `types.ts` 기준으로 Provider 교체 가능하게 만들기
- API Key를 클라이언트에 직접 노출하지 않도록 서버리스/백엔드 라우트 설계 문서 작성
- 실제 Provider는 `.env` 기반으로 분기하되, 키가 없으면 mock으로 fallback

## 중요한 미학

- 로봇청소기를 위에서 본 듯한 에이전트 네모박스
- 에이전트별 색상 확실히 구분
- 고대 그리스 아고라 + 양피지 + 신전 + 단어밭
- 너무 고증하지 말고 “고대 그리스 관료제 + 장난감 시뮬레이터” 느낌
- 중요한 것은 3D 화려함이 아니라 **규칙이 보이는 것**

## 하지 말 것

- 처음부터 3D로 가지 말 것. 2D 탑다운으로 충분하다.
- 실제 LLM API를 첫 단계에서 강제하지 말 것. 발표장에서 키 문제로 망한다.
- 에이전트가 그냥 채팅만 하게 만들지 말 것. 반드시 이동, 탐욕, 분쟁, 투표, 봉헌글 작성이 연결되어야 한다.
- 설정만 늘리지 말 것. MVP 상호작용 루프를 먼저 완성할 것.

## 핵심 코드 요구

- Phaser Scene과 React UI를 느슨하게 분리한다.
- 상태는 Zustand store로 관리한다.
- 에이전트 성격/지식은 Markdown 파일로 보존하되, 런타임용 요약 데이터는 `src/data/agents.ts`에서 관리한다.
- 나중에 Markdown을 로딩해 prompt에 넣을 수 있도록 `src/llm/promptBuilders.ts` 구조를 준비한다.

## 완료 기준

유저가 브라우저에서 다음을 할 수 있으면 1차 성공이다.

1. 단어 3~10개 입력
2. 단어들이 하단에 흩어짐
3. 세 네모 에이전트가 움직이며 단어를 집음
4. 같은 단어를 두고 분쟁 발생
5. 아고라 토론과 투표 진행
6. 각 에이전트가 자기 단어로 한 문단씩 릴레이 봉헌글 작성
7. 상단 양피지에 글이 누적됨
8. 에이전트 hover 시 수집한 단어 확인
