# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- DO NOT use inline comments to describe code. Only use comments to explain WHY code exists.

## Commands

```bash
npm install
npm run dev              # Vite dev server
npm run build
npm test                 # Watch mode
npm test -- --run        # Run once
npm test -- --run src/game/__tests__/GameManager.test.js
npm run lint
npm run lint:fix
npm run format
npm run format:check
```

**Docker:**
```bash
docker compose --profile dev up     # Port 3000
docker compose --profile prod up    # Port 8080
```

## Architecture

**MVC Pattern:**
- **Model:** `GameManager` class (`src/game/gameManager.js`) - pure JavaScript, no React dependencies
- **View:** React components in `src/components/`
- **Controller:** `useGameController` hook (`src/game/useGameController.js`) - wraps GameManager and triggers React re-renders

**Game Flow:**
1. Upload Phase → user uploads SGF file or pastes online-go.com URL
2. Study Phase → navigate through moves, select replay range
3. Replay Phase → recreate moves from memory with progressive hints
   - Optional: Single-side replay (play as Black or White only, opponent auto-plays)
4. Complete → statistics with Play Again/New Game options

**Board State Management:**
- Uses `@sabaki/go-board` for immutable board state and capture detection
- `boardHistory` array stores all board states for O(1) navigation
- `studyPosition` indexes into `boardHistory`
- `replayStartMove`/`replayEndMove` define the replay range (0-indexed)

**Progressive Hint System (Replay Phase):**
- Wrong attempts trigger progressively smaller region highlights (quadrant → sub-quadrant → smaller)
- When region is small enough (≤3x3), shows exact position marker

**Key Libraries:**
- `@sabaki/go-board` - Board state, move validation, capture detection
- `@sabaki/shudan` - React Goban component for rendering
- `@sabaki/sgf` - SGF file parsing

**CSS Modules (all in `src/styles/`):**
- Dynamic classes use array join pattern: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')`

**Responsive Layout (768px breakpoint):**
- Desktop: Left sidebar (280px) + board area + right panel
- Mobile: Collapsible header (overlay) + board + fixed bottom bar
