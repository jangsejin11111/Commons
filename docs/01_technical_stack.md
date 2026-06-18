# 01. Technical Stack

## Recommended Stack

### Vite + React + TypeScript

React는 상단 봉헌문, 입력창, 로그 패널, 에이전트 인벤토리 표시 같은 UI에 적합하다. TypeScript는 에이전트 상태, 단어 소유권, 분쟁 상태, LLM 응답 타입을 안전하게 관리하기 좋다. Vite는 가볍고 빠른 개발 서버와 HMR을 제공하므로 프로토타입 반복에 유리하다.

### Phaser 3

Phaser는 2D HTML5 게임 프레임워크다. 이 프로젝트는 탑다운 2D 월드, 에이전트 이동, 단어 토큰, 손 뻗기 선 애니메이션, 아고라 이동, hover 감지처럼 2D 게임 루프가 핵심이므로 Three.js보다 Phaser가 적합하다.

### Zustand

React UI와 Phaser Scene 사이에서 상태를 공유한다. Redux까지 갈 필요 없다. 이 프로젝트는 상태가 중요하지만 규모가 과하게 크지는 않다.

### LLM Provider Adapter

초기에는 mockProvider로 발표 가능하게 만든다. 이후 실제 LLM API를 붙일 때는 Provider 인터페이스만 교체한다.

## Runtime Principle

- API Key는 클라이언트에 노출하지 않는다.
- 실제 LLM 호출은 서버리스 함수, Express 서버, Next API Route 중 하나로 처리한다.
- 프로토타입은 mock LLM fallback을 반드시 유지한다.

## Suggested Future Backend Options

1. Vercel/Netlify serverless function
2. Express mini server
3. Cloudflare Worker
4. Supabase Edge Function

## Why Not Pure Canvas?

직접 Canvas로 짜면 초반에는 빨라 보여도 충돌, hover, 애니메이션, 레이어, 타이머가 늘면서 금방 지저분해진다. Phaser가 그 지옥을 대신 치워준다. 고마워해라, 인류.
