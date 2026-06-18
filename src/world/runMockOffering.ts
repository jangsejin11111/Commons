import { agentProfiles } from '../data/agents';
import { llmProvider } from '../llm/providers';
import { relayOrder } from '../game/systems/RelayWritingSystem';
import { useGameStore } from '../state/useGameStore';

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * 릴레이 봉헌 신화.
 * 한 라운드는 하나의 seed 단어와 하나의 공유 장면(motif)으로,
 * MNEME(기원) → DOLON(절도·왜곡) → DEMOS(군중 확산) 순서로 이어 써
 * 세 문단이 합쳐 하나의 짧은 신화처럼 읽히게 한다.
 */
export async function runOffering() {
  const store = useGameStore.getState();
  if (store.offeringInProgress) return;
  if (store.phase === 'DISPUTE') {
    store.addLog('아고라 분쟁이 끝난 뒤에 봉헌을 시작할 수 있습니다.');
    return;
  }

  // 이 라운드 신화의 seed 단어 + 공유 장면을 한 번만 정해 세 에이전트가 함께 쓴다.
  const collected = store.agents.flatMap((a) => a.inventory);
  const focusWord = collected.length
    ? collected[Math.floor(Math.random() * collected.length)]
    : '침묵';
  const roundSeed = Math.floor(Math.random() * 100000);

  store.setOfferingInProgress(true);
  store.setPhase('OFFERING');
  store.addLog(`🕯️ 봉헌 의식이 시작됩니다 — '${focusWord}'의 신화를 세 손이 이어 씁니다.`);

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
      previousAgentId,
      focusWord,
      roundSeed
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
