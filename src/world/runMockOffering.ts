import { agentProfiles } from '../data/agents';
import { llmProvider } from '../llm/providers';
import { relayOrder } from '../game/systems/RelayWritingSystem';
import { useGameStore } from '../state/useGameStore';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 릴레이 봉헌글 작성.
 * MNEME → DOLON → DEMOS 순서로 각자 한 문단씩 이어 쓴다.
 * (docs/03 Relay Offering, CLAUDE.md 완료 기준 6번)
 */
export async function runOffering() {
  const store = useGameStore.getState();
  if (store.offeringInProgress) return;
  if (store.phase === 'DISPUTE') {
    store.addLog('아고라 분쟁이 끝난 뒤에 봉헌을 시작할 수 있습니다.');
    return;
  }

  store.setOfferingInProgress(true);
  store.setPhase('OFFERING');
  store.addLog('🕯️ 봉헌 의식이 시작됩니다. 세 에이전트가 릴레이로 글을 바칩니다.');

  for (const agentId of relayOrder) {
    const agent = useGameStore.getState().agents.find((a) => a.id === agentId);
    const profile = agentProfiles.find((p) => p.id === agentId);
    if (!agent || !profile) continue;

    useGameStore.getState().setAgentState(agentId, 'WRITING');
    useGameStore.getState().addLog(`${profile.name}가 봉헌문을 작성합니다…`);

    const currentStory = useGameStore.getState().offerings.map((p) => p.text).join('\n');
    const previousAgentId = useGameStore.getState().offerings.at(-1)?.agentId;

    const paragraph = await llmProvider.generateOfferingParagraph({
      agentId,
      currentStory,
      inventory: agent.inventory,
      previousAgentId
    });

    useGameStore.getState().addOffering({
      id: `offering-${Date.now()}-${agentId}`,
      createdAt: Date.now(),
      ...paragraph
    });
    useGameStore.getState().setAgentState(agentId, 'IDLE');
    await wait(900);
  }

  useGameStore.getState().setPhase('HARVEST');
  useGameStore.getState().setOfferingInProgress(false);
  useGameStore.getState().addLog('🏛️ 봉헌글 한 바퀴가 완성되어 양피지에 새겨졌습니다.');
}

// 기존 호출부 호환용 별칭.
export const runMockOffering = runOffering;
