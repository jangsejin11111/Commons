# 04. LLM Pipeline

## Principle

LLM은 아무 때나 부르면 안 된다. 그러면 비용도 터지고 리듬도 무너진다. LLM 호출은 **의례적 순간**에만 사용한다.

## LLM Call Moments

1. 아고라 주장 생성
2. 아고라 투표 이유 생성
3. 릴레이 봉헌글 문단 생성
4. 에이전트 자기 해석/짧은 중얼거림 생성

## No LLM Needed

- 이동
- 단어 욕망 점수 계산
- 단어 수집
- hover 인벤토리 표시
- 기본 로그
- 충돌 판정

## Provider Contract

```ts
interface LLMProvider {
  generateDebateLine(input: DebateInput): Promise<DebateLine>;
  generateVote(input: VoteInput): Promise<VoteDecision>;
  generateOfferingParagraph(input: OfferingInput): Promise<OfferingParagraph>;
}
```

## Prompt Ingredients

- agent identity
- agent speech style
- agent collected words
- disputed word
- current story so far
- world rule summary
- output format constraints

## Output Must Be Structured

Claude Code should enforce JSON-ish structured responses when using real LLM. Never parse free text blindly.

Example:

```json
{
  "agentId": "mneme",
  "line": "이 단어는 기록되어야 한다. 훔쳐질 수 없다.",
  "voteFor": "mneme",
  "reason": "단어가 이미 문장의 뼈대 안에 들어갔기 때문"
}
```

## Mock Strategy

Mock provider should generate personality-consistent lines from templates. This makes the demo stable even without an API key.
