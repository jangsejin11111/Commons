import { create } from 'zustand';
import type {
  AgentId,
  AgentRuntimeState,
  AgentState,
  DebateLine,
  Dispute,
  GamePhase,
  OfferingParagraph,
  VoteDecision,
  WordTokenData
} from '../types';
import { initialAgentStates } from '../data/agents';
import { randomFieldPoint } from '../game/config/worldZones';

interface GameStore {
  phase: GamePhase;
  words: WordTokenData[];
  agents: AgentRuntimeState[];
  disputes: Dispute[];
  logs: string[];
  offerings: OfferingParagraph[];
  offeringInProgress: boolean;
  setPhase: (phase: GamePhase) => void;
  addWords: (texts: string[]) => void;
  claimWord: (wordId: string, agentId: AgentId) => void;
  setAgentInventory: (agentId: AgentId, inventory: string[]) => void;
  setAgentState: (agentId: AgentId, state: AgentState, targetWordId?: string) => void;
  addLog: (line: string) => void;
  openDispute: (wordId: string, contenders: AgentId[]) => Dispute | undefined;
  addDebateLine: (disputeId: string, line: DebateLine) => void;
  addVote: (disputeId: string, vote: VoteDecision) => void;
  resolveDispute: (disputeId: string, winnerId: AgentId) => void;
  setOfferingInProgress: (value: boolean) => void;
  addOffering: (paragraph: OfferingParagraph) => void;
  reset: () => void;
}

const randomId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const cap = (id: AgentId) => id.toUpperCase();

export const useGameStore = create<GameStore>((set, get) => ({
  phase: 'HARVEST',
  words: [],
  agents: initialAgentStates,
  disputes: [],
  logs: ['신전이 열렸습니다. 아직 단어는 땅에 닿지 않았습니다.'],
  offerings: [],
  offeringInProgress: false,

  setPhase: (phase) => set({ phase }),

  addWords: (texts) => set((state) => {
    const newWords: WordTokenData[] = texts
      .map((text) => text.trim())
      .filter(Boolean)
      .map((text) => {
        const point = randomFieldPoint();
        return {
          id: randomId('word'),
          text,
          x: point.x,
          y: point.y,
          state: 'SPAWNED' as const,
          targetedBy: [],
          createdAt: Date.now()
        };
      });
    return {
      words: [...state.words, ...newWords],
      logs: [...state.logs, `신의 단어 ${newWords.length}개가 단어밭에 떨어졌습니다.`]
    };
  }),

  claimWord: (wordId, agentId) => set((state) => {
    const word = state.words.find((w) => w.id === wordId);
    if (!word) return state;
    const agents = state.agents.map((agent) => {
      if (agent.id !== agentId) return agent;
      return { ...agent, inventory: [...agent.inventory, word.text], state: 'IDLE' as const, targetWordId: undefined };
    });
    return {
      agents,
      words: state.words.filter((w) => w.id !== wordId),
      logs: [...state.logs, `${cap(agentId)}가 '${word.text}'을/를 수확했습니다.`]
    };
  }),

  setAgentInventory: (agentId, inventory) => set((state) => ({
    agents: state.agents.map((agent) => agent.id === agentId ? { ...agent, inventory } : agent)
  })),

  setAgentState: (agentId, agentState, targetWordId) => set((state) => ({
    agents: state.agents.map((agent) =>
      agent.id === agentId ? { ...agent, state: agentState, targetWordId } : agent
    )
  })),

  addLog: (line) => set((state) => ({ logs: [...state.logs, line] })),

  openDispute: (wordId, contenders) => {
    const word = get().words.find((w) => w.id === wordId);
    if (!word) return undefined;
    const dispute: Dispute = {
      id: randomId('dispute'),
      wordId,
      wordText: word.text,
      contenders,
      debateLines: [],
      votes: [],
      status: 'OPEN'
    };
    set((state) => ({
      phase: 'DISPUTE',
      disputes: [...state.disputes, dispute],
      words: state.words.map((w) => w.id === wordId ? { ...w, state: 'CONTESTED', targetedBy: contenders } : w),
      agents: state.agents.map((agent) =>
        contenders.includes(agent.id) ? { ...agent, state: 'DISPUTING' as const } : agent
      ),
      logs: [...state.logs, `분쟁 발생: '${word.text}'을/를 두고 ${contenders.map(cap).join(' vs ')} — 아고라가 소집됩니다.`]
    }));
    return dispute;
  },

  addDebateLine: (disputeId, line) => set((state) => ({
    disputes: state.disputes.map((d) => d.id === disputeId ? { ...d, status: 'DEBATING', debateLines: [...d.debateLines, line] } : d),
    agents: state.agents.map((agent) => agent.id === line.agentId ? { ...agent, state: 'DEBATING' as const } : agent),
    logs: [...state.logs, `🏛️ ${cap(line.agentId)}: ${line.line}`]
  })),

  addVote: (disputeId, vote) => set((state) => ({
    disputes: state.disputes.map((d) => d.id === disputeId ? { ...d, status: 'VOTING', votes: [...d.votes, vote] } : d),
    agents: state.agents.map((agent) => agent.id === vote.agentId ? { ...agent, state: 'VOTING' as const } : agent),
    logs: [...state.logs, `🗳️ ${cap(vote.agentId)} → ${cap(vote.voteFor)}: ${vote.reason}`]
  })),

  resolveDispute: (disputeId, winnerId) => set((state) => {
    const dispute = state.disputes.find((d) => d.id === disputeId);
    if (!dispute) return state;
    const agents = state.agents.map((agent) => {
      const base = { ...agent, state: 'IDLE' as const, targetWordId: undefined };
      return agent.id === winnerId ? { ...base, inventory: [...agent.inventory, dispute.wordText] } : base;
    });
    return {
      phase: 'HARVEST',
      agents,
      words: state.words.filter((w) => w.id !== dispute.wordId),
      disputes: state.disputes.map((d) => d.id === disputeId ? { ...d, winnerId, status: 'RESOLVED' } : d),
      logs: [...state.logs, `⚖️ 아고라 판결: '${dispute.wordText}'은/는 ${cap(winnerId)}에게 귀속됩니다.`]
    };
  }),

  setOfferingInProgress: (value) => set({ offeringInProgress: value }),

  addOffering: (paragraph) => set((state) => ({ offerings: [...state.offerings, paragraph] })),


  reset: () => set({
    phase: 'HARVEST',
    words: [],
    agents: initialAgentStates.map((agent) => ({ ...agent, inventory: [] })),
    disputes: [],
    offerings: [],
    offeringInProgress: false,
    logs: ['신전이 다시 열렸습니다.']
  })
}));

if (import.meta.env.DEV) {
  (window as unknown as { __store: typeof useGameStore }).__store = useGameStore;
}
