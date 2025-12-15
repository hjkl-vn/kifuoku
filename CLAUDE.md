# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

- DO NOT use inline comments to describe code. Only use comments to explain WHY code exists.

## Go Memory Game (`go-memory-game/`)

### Commands

```bash
cd go-memory-game

npm run dev      # Start development server (Vite)
npm run build    # Production build
npm test         # Run tests in watch mode
npm test -- --run   # Run tests once
```

### Architecture

**MVC Pattern:**
- **Model:** `GameManager` class (`src/game/GameManager.js`) - pure JavaScript, no React dependencies
- **View:** React components in `src/components/`
- **Controller:** `useGameManager` hook (`src/game/useGameManager.js`) - wraps GameManager and triggers React re-renders

**Game Flow:**
1. Upload Phase → user uploads SGF file
2. Study Phase → navigate through moves with Previous/Next
3. Replay Phase → recreate moves from memory with progressive hints
4. Complete Phase → show statistics

**Board State Management:**
- Uses `@sabaki/go-board` for immutable board state and capture detection
- `boardHistory` array stores all board states for O(1) navigation
- `studyPosition` indexes into `boardHistory`

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
- `getBoardSize(sgfContent)` - returns board size (only 19x19 supported)
- `getGameInfo(sgfContent)` - extracts metadata (PB, PW, BR, WR, DT, GN, RE, RU)

**CSS Modules:**
- `src/styles/layout.module.css` - shared layout (container, panels, statsBox)
- `src/styles/buttons.module.css` - shared button styles with `composes`
- Component-specific styles in `src/components/*.module.css`
- Dynamic classes use array join pattern: `[styles.a, condition ? styles.b : ''].filter(Boolean).join(' ')`
