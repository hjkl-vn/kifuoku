# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- DO NOT use inline comments to describe code. Only use comments to explain WHY code exists.

## Commands

```bash
npm install         # Install dependencies
npm run dev         # Start development server (Vite)
npm run build       # Production build
npm test            # Run tests in watch mode
npm test -- --run   # Run tests once
npm test -- --run src/game/__tests__/GameManager.test.js  # Run single test file
```

**Docker:**
```bash
docker compose --profile dev up    # Development with hot reload (port 3000)
docker compose --profile prod up   # Production with nginx (port 8080)
```

## Architecture

**MVC Pattern:**
- **Model:** `GameManager` class (`src/game/GameManager.js`) - pure JavaScript, no React dependencies
- **View:** React components in `src/components/`
- **Controller:** `GameController` hook (`src/game/GameController.js`) - wraps GameManager and triggers React re-renders

**Game Flow:**
1. Upload Phase → user uploads SGF file
2. Study Phase → navigate through moves, select replay range at the end
3. Replay Phase → recreate moves from memory with progressive hints
4. Complete → modal overlay showing statistics with Play Again/New Game options

**Board State Management:**
- Uses `@sabaki/go-board` for immutable board state and capture detection
- `boardHistory` array stores all board states for O(1) navigation
- `studyPosition` indexes into `boardHistory`
- `replayStartMove`/`replayEndMove` define the replay range (0-indexed)

**Progressive Hint System (Replay Phase):**
1. First wrong attempt → quadrant highlight (paintMap)
2. Second wrong attempt → letter markers A/B/C/D (markerMap with type: 'label')
3. Third wrong attempt → point marker at correct position

**Key Libraries:**
- `@sabaki/go-board` - Board state, move validation, capture detection
- `@sabaki/shudan` - React Goban component for rendering
- `@sabaki/sgf` - SGF file parsing

**SGF Parser (`src/lib/sgf-parser.js`):**
- `parseSGFToMoves(sgfContent)` - extracts moves array
- `getBoardSize(sgfContent)` - returns board size (supports 9x9, 13x13, 19x19, etc.)
- `getGameInfo(sgfContent)` - extracts metadata (PB, PW, BR, WR, DT, GN, RE, RU)

**Constants (`src/game/constants.js`):**
- `DEFAULT_BOARD_SIZE`, `GHOST_HINT_COUNT`, `GHOST_HINT_RADIUS` - game configuration
- `PHASES`, `HINT_TYPES` - enums for game state
- `getQuadrant()`, `getQuadrantVertices()` - hint system helpers (accept boardSize parameter)

**CSS Modules:**
- `src/styles/layout.module.css` - shared layout (container, panels, statsBox)
- `src/styles/buttons.module.css` - shared button styles with `composes`
- Component-specific styles in `src/components/*.module.css`
- Dynamic classes use array join pattern: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')`
