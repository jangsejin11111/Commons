# 06. Implementation Tasks for Claude Code

## Phase 0 — Clean Setup

- Confirm package install works
- Fix any TypeScript errors
- Ensure `npm run dev` launches
- Keep folder structure intact

## Phase 1 — Phaser Scene

- Implement `MainScene`
- Draw three zones: parchment, agora, word field
- Spawn three agent rectangles from `src/data/agents.ts`
- Add basic wandering movement

## Phase 2 — Word Input

- Implement React input panel
- Parse comma/space/newline separated words
- Add words to Zustand store
- Scene listens to store or event bus and spawns WordTokens

## Phase 3 — Agent Desire + Movement

- Each agent scores available words
- Agent picks target
- Agent moves toward target
- Near target, show reach line
- On collection, remove word and update inventory

## Phase 4 — Hover Inventory

- Pointer hover over agent shows inventory tooltip
- Tooltip lists collected words and current state

## Phase 5 — Dispute Detection

- If 2+ agents target same word within threshold, mark word contested
- Pause normal harvesting
- Send all agents to agora

## Phase 6 — Agora Debate

- Use `mockProvider.generateDebateLine`
- Show debate log in UI
- After debate, call `mockProvider.generateVote`
- Assign word to winner by majority

## Phase 7 — Relay Offering

- Add `Begin Offering` button or auto-trigger after total collected word count >= 6
- Agents write in order: MNEME → DOLON → DEMOS
- Use mockProvider first
- Type paragraphs into parchment screen
- Store history

## Phase 8 — Polish

- Add ancient parchment CSS
- Add agent-specific reach lines
- Add small particles when words spawn/vanish
- Add speed controls for rehearsal

## Phase 9 — Real LLM Adapter

- Implement but do not force real Provider
- `.env` chooses provider
- If key absent, fallback to mock
- Keep prompts in `src/llm/promptBuilders.ts`

## Definition of Done

A user can run the app and demonstrate one full loop in under three minutes.
