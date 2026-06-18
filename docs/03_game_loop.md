# 03. Game Loop

## Start

1. 화면 로드
2. 세 에이전트가 이미 아고라 근처 혹은 단어밭 주변을 배회한다
3. 양피지는 비어 있거나 첫 문장만 있다: “신이 아직 말하지 않았다.”

## Word Input

유저가 입력창에 단어를 쉼표, 공백, 줄바꿈으로 입력한다.

예:

```txt
고양이, 장례식, 편의점, 파란색, 부끄러움
```

입력된 단어는 `WordToken[]`으로 분해되어 하단 단어밭에 랜덤 배치된다.

## Agent Desire Scoring

각 에이전트는 단어를 볼 때 점수를 매긴다.

```txt
score = tasteMatch + scarcityBonus + rivalryBonus + storyNeed + chaosNoise
```

- tasteMatch: 성격/취향과 맞는 정도
- scarcityBonus: 인벤토리에 단어가 부족할수록 증가
- rivalryBonus: 경쟁자가 노리는 단어면 증가
- storyNeed: 현재 봉헌글에 필요한 단어면 증가
- chaosNoise: 예측불가능성

## Movement

- 에이전트는 목표 단어를 향해 이동
- 너무 딱딱하지 않게 약간 흔들리는 경로 사용
- 단어 근처 도달 시 손/선/광선이 단어 쪽으로 뻗음

## Collection

- 단어 수집 성공 시 토큰은 사라짐
- 에이전트 인벤토리에 추가
- hover 시 인벤토리 툴팁 표시
- 로그에 기록: `MNEME가 '장례식'을 보존함.`

## Dispute

- 같은 단어를 여러 에이전트가 동시에 목표로 잡으면 분쟁 발생
- 단어가 빛나거나 떨림
- 모든 에이전트 이동 중지 후 아고라로 집결

## Agora Debate

- UI에 토론 로그 표시
- mockProvider는 즉시 생성해도 되지만, 화면에서는 typing처럼 순차 출력
- 실제 시연용 시간: 15초
- 최종 버전 시간: 60초

## Vote

- 세 에이전트가 투표
- 투표 이유를 한 줄씩 표시
- 승자에게 단어 소유권 부여

## Relay Offering

- 일정 단어 수집 후 또는 사용자가 `봉헌 시작` 버튼 클릭 시 시작
- 각 에이전트가 한 문단씩 작성
- 글은 상단 양피지에 천천히 타이핑됨
- 완성된 텍스트는 `offeringHistory`에 저장
