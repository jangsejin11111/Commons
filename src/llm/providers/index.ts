import type { LLMProvider } from './types';
import { mockProvider } from './mockProvider';

/**
 * Provider selection.
 *
 * MVP 3 design (docs/04_llm_pipeline.md):
 * - API 키는 절대 클라이언트 번들에 노출하지 않는다.
 * - 실제 LLM은 서버리스/백엔드 라우트(`server/`)를 통해서만 호출한다.
 * - `VITE_LLM_PROVIDER`가 mock이 아니거나 키가 없으면 항상 mock으로 fallback 한다.
 *
 * 새 Provider를 붙이려면 `LLMProvider` 인터페이스(types.ts)를 구현하고
 * 아래 switch에 분기를 추가하면 된다. 그 외 코드는 손댈 필요가 없다.
 */
export function resolveProvider(): LLMProvider {
  const selected = (import.meta.env.VITE_LLM_PROVIDER ?? 'mock').toLowerCase();

  switch (selected) {
    // 예: case 'anthropic': return createServerProxyProvider('/api/llm');
    case 'mock':
    default:
      if (selected !== 'mock') {
        console.warn(
          `[llm] provider '${selected}' 미구현 또는 키 부재 — mockProvider로 fallback 합니다.`
        );
      }
      return mockProvider;
  }
}

export const llmProvider: LLMProvider = resolveProvider();
