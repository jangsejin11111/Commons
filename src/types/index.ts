export type AgentId = 'mneme' | 'dolon' | 'demos';

export type GamePhase = 'HARVEST' | 'DISPUTE' | 'OFFERING';

export type AgentState =
  | 'IDLE'
  | 'SEEKING'
  | 'REACHING'
  | 'COLLECTING'
  | 'DISPUTING'
  | 'GOING_TO_AGORA'
  | 'DEBATING'
  | 'VOTING'
  | 'WRITING';

export type WordState = 'SPAWNED' | 'TARGETED' | 'CONTESTED' | 'OWNED' | 'OFFERED';

export interface AgentProfile {
  id: AgentId;
  name: string;
  role: string;
  color: string;
  tasteKeywords: string[];
  speechStyle: string;
  writingBias: string;
}

export interface AgentRuntimeState {
  id: AgentId;
  state: AgentState;
  inventory: string[];
  targetWordId?: string;
}

export interface WordTokenData {
  id: string;
  text: string;
  x: number;
  y: number;
  state: WordState;
  targetedBy: AgentId[];
  ownerId?: AgentId;
  createdAt: number;
}

export interface DebateLine {
  agentId: AgentId;
  line: string;
}

export interface VoteDecision {
  agentId: AgentId;
  voteFor: AgentId;
  reason: string;
}

export interface Dispute {
  id: string;
  wordId: string;
  wordText: string;
  contenders: AgentId[];
  debateLines: DebateLine[];
  votes: VoteDecision[];
  winnerId?: AgentId;
  status: 'OPEN' | 'DEBATING' | 'VOTING' | 'RESOLVED';
}

export interface OfferingParagraph {
  id: string;
  agentId: AgentId;
  usedWords: string[];
  text: string;
  createdAt: number;
}
