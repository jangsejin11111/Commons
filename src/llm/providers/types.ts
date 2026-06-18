import type { AgentId, DebateLine, OfferingParagraph, VoteDecision } from '../../types';

export interface DebateInput {
  agentId: AgentId;
  disputedWord: string;
  contenders: AgentId[];
  inventory: string[];
}

export interface VoteInput {
  agentId: AgentId;
  disputedWord: string;
  contenders: AgentId[];
  debateLines: DebateLine[];
}

export interface OfferingInput {
  agentId: AgentId;
  currentStory: string;
  inventory: string[];
  previousAgentId?: AgentId;
  /** 이 라운드 신화의 seed 단어 (세 에이전트가 공유). */
  focusWord?: string;
  /** 이 라운드가 공유하는 장면(motif) 선택 seed — 세 문단이 같은 장면을 이어쓰게 한다. */
  roundSeed?: number;
}

export interface LLMProvider {
  generateDebateLine(input: DebateInput): Promise<DebateLine>;
  generateVote(input: VoteInput): Promise<VoteDecision>;
  generateOfferingParagraph(input: OfferingInput): Promise<Omit<OfferingParagraph, 'id' | 'createdAt'>>;
}
