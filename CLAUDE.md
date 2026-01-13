# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kifu-oku (棋譜憶) - A Go game memory trainer. Users upload SGF files or paste online-go.com URLs, study the game, then replay moves from memory with progressive hints.

## Code Style

- DO NOT use inline comments to describe code. Only use comments to explain WHY code exists.

## Prerequisites

- Node.js 18+

## Commands

```bash
npm install
npm run dev              # Vite dev server (port 3000)
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
docker compose --profile dev up     # Port 8181
docker compose --profile prod up    # Port 9090
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
- `currentHintRegion` tracks hint state across both `validateMove()` and `validatePass()`

**Pass Move Handling:**
- Pass moves (`move.isPass = true`) keep the same board state in history
- Both `validatePass()` and `validateMove()` set `currentHintRegion` on wrong attempts

**Board Utils (`src/game/boardUtils.js`):**
- `getQuadrantBounds()`, `getSubQuadrant()`, `isRegionSmallEnough()` - hint region calculations
- `colorToSign()` - converts 'B'/'W' to 1/-1 for @sabaki/go-board

**SGF Parsing (`src/lib/sgfParser.js`):**
- `parseSGF()` - Single parse returning `{ moves, boardSize, gameInfo, setupStones }` (preferred)
- Individual functions available for backwards compatibility: `parseSGFToMoves()`, `getBoardSize()`, `getGameInfo()`, `getSetupStones()`

**OGS Integration (`src/lib/ogs.js`):**
- Fetches SGF from online-go.com game URLs via their public API
- `extractGameId()`, `isValidOgsUrl()`, `fetchOgsSgf()`

**Key Libraries:**
- `@sabaki/go-board` - Board state, move validation, capture detection
- `@sabaki/shudan` - React Goban component for rendering
- `@sabaki/sgf` - SGF file parsing

**Custom Hooks (`src/hooks/`):**
- `useBoardSize` - Responsive board sizing based on container dimensions (ResizeObserver)
- `useIsMobile` - Media query hook for JS-level mobile detection (< 768px)
- `useBorderFlash` - Timed visual feedback with automatic cleanup

**Styling (Tailwind CSS v4):**
- Uses `@tailwindcss/vite` plugin (no tailwind.config.js needed)
- Custom theme colors defined in `src/index.css` via `@theme` block: primary, success, error, neutral, stone-black, stone-white
- Dynamic classes use array join pattern: `['base-class', condition ? 'conditional-class' : ''].filter(Boolean).join(' ')`
- Ghost stone animation for pending moves defined in `src/index.css` (`.has-pending-move` selectors)

**Responsive Layout (768px breakpoint):**
- Desktop (md+): Left sidebar (280px) + board area + right panel (max-w-320px)
- Mobile: CollapsiblePanel (top/bottom positions) + board + fixed bottom bar

**Mobile Touch Handling:**
- `touch-action: pan-x pan-y` on html/body disables pinch-to-zoom and double-tap zoom
- `overscroll-behavior: none` prevents rubber-band/bounce scrolling
- For mobile testing via ngrok, add host to `server.allowedHosts` in `vite.config.js`

**Cross-Component Events:**
- `reset-game` custom event: Header dispatches, HomePage listens to reset game state
- Pattern: `window.dispatchEvent(new window.CustomEvent('event-name'))`

**Logging (`src/lib/logger.js`):**
- `createLogger('ModuleName')` returns `{ info, warn, error }` methods
- Automatically disabled in production (`import.meta.env.DEV` check)
- Output format: `[ModuleName] message { data }`

**Analytics (`src/lib/analytics.js`):**
- PostHog integration with 6 events: `game_loaded`, `replay_started`, `replay_completed`, `game_reset`, `new_game_started`, `annotation_used`
- Requires `VITE_POSTHOG_KEY` env var; gracefully disabled when not set
- Event properties use snake_case (PostHog convention)

**Test Data:**
- SGF test files in `public/test-files/` for manual testing scenarios

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_POSTHOG_KEY` | PostHog project API key (analytics disabled when unset) |
| `VITE_POSTHOG_HOST` | PostHog instance URL (defaults to US cloud) |

For local development, copy `.env.example` to `.env.local`.

## CI/CD

PRs to `main` run GitHub Actions: tests, ESLint, Prettier format check. All must pass before merging.

## Deployment

Hosted on Cloudflare Pages. Cache headers configured in `public/_headers`:
- `/assets/*` - 1 year, immutable (Vite hashed bundles)
- `/`, `/*.html` - no-cache (always fresh)
- `/sounds/*`, `/favicon/*` - 1 week
