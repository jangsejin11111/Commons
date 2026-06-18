# 09. Data Schema

## Agent

```ts
type AgentId = 'mneme' | 'dolon' | 'demos';

type AgentState =
  | 'IDLE'
  | 'SEEKING'
  | 'REACHING'
  | 'COLLECTING'
  | 'DISPUTING'
  | 'GOING_TO_AGORA'
  | 'DEBATING'
  | 'VOTING'
  | 'WRITING';

interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  tasteKeywords: string[];
  speechStyle: string;
  writingBias: string;
}
```

## WordToken

```ts
interface WordToken {
  id: string;
  text: string;
  x: number;
  y: number;
  state: 'SPAWNED' | 'TARGETED' | 'CONTESTED' | 'OWNED' | 'OFFERED';
  targetedBy: AgentId[];
  ownerId?: AgentId;
  createdAt: number;
}
```

## Dispute

```ts
interface Dispute {
  id: string;
  wordId: string;
  wordText: string;
  contenders: AgentId[];
  debateLines: DebateLine[];
  votes: VoteDecision[];
  winnerId?: AgentId;
  status: 'OPEN' | 'DEBATING' | 'VOTING' | 'RESOLVED';
}
```

## Offering

```ts
interface OfferingParagraph {
  id: string;
  agentId: AgentId;
  usedWords: string[];
  text: string;
  createdAt: number;
}
```
