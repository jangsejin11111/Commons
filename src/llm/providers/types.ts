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
}

export interface LLMProvider {
  generateDebateLine(input: DebateInput): Promise<DebateLine>;
  generateVote(input: VoteInput): Promise<VoteDecision>;
  generateOfferingParagraph(input: OfferingInput): Promise<Omit<OfferingParagraph, 'id' | 'createdAt'>>;
}
