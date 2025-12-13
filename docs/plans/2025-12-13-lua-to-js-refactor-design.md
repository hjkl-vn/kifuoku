# Lua to JavaScript Refactor Design

**Date:** 2025-12-13
**Status:** Approved
**Objective:** Replace Lua game logic with JavaScript using `@sabaki/go-board` library

## Problem

The current implementation uses Fengari (Lua VM) for game state management. This approach has two critical flaws:

1. **No capture detection** - Lua code places stones but never removes captured groups
2. **Complexity overhead** - Maintaining Lua-JavaScript bridge adds unnecessary complexity for functionality JavaScript handles natively

The 147-move tournament game in `sgf/sample.sgf` requires proper capture handling to function correctly.

## Solution

Remove Lua entirely. Implement game logic in JavaScript using `@sabaki/go-board` for board operations and capture detection.

## Architecture

The refactored application follows **Model-View-Controller** pattern:

**Model:** `GameManager` class (pure JavaScript)
- Wraps `@sabaki/go-board` for board state and capture detection
- Manages three game phases: upload → study → replay → complete
- Tracks statistics: accuracy, timing, hint usage
- No React dependencies

**View:** React components
- `StudyPhase.jsx` - Navigate through moves with prev/next controls
- `ReplayPhase.jsx` - Test memory with progressive hint system
- `UploadPhase.jsx` - SGF file upload (unchanged)
- `ProgressBar.jsx` - Visual progress indicator (shared)

**Controller:** `useGameManager` React hook
- Wraps GameManager instance
- Triggers re-renders when game state changes
- Components call methods: `gameManager.nextMove()`, `gameManager.validateMove(x, y)`

## File Structure

```
src/game/
├── GameManager.js        (core game logic)
├── useGameManager.js     (React integration)
└── constants.js          (phase names, quadrants)

src/lib/
└── sgf-parser.js         (unchanged)

src/components/
├── StudyPhase.jsx
├── ReplayPhase.jsx
├── UploadPhase.jsx
└── ProgressBar.jsx       (new)
```

## GameManager Class API

### Constructor
```javascript
new GameManager(sgfMoves)
```

### Properties
- `phase` - Current phase: 'upload' | 'study' | 'replay' | 'complete'
- `moves` - Parsed SGF moves: `Array<{x, y, color}>`
- `boardHistory` - Immutable board snapshots: `Array<Board>`
- `studyPosition` - Current move index in study phase
- `replayPosition` - Current move index in replay phase
- `stats` - Statistics object

### Statistics
```javascript
stats: {
  wrongMoveCount: number,
  correctFirstTry: number,
  quadrantHintsUsed: number,
  ghostHintsUsed: number,
  triangleHintsUsed: number,
  startTime: number,
  moveTimes: Array<number>
}
```

### Methods

**Study Phase:**
- `studyNext()` - Advance one move forward
- `studyPrev()` - Go back one move
- `startReplay()` - Transition to replay phase

**Replay Phase:**
- `validateMove(x, y)` - Check if move is correct, return hint if wrong
- `handleGhostClick(x, y)` - Process ghost stone selection

**Utilities:**
- `getCurrentBoard()` - Get current `@sabaki/go-board` instance
- `getState()` - Get full state for React render
- `getQuadrant(x, y)` - Calculate quadrant for hint
- `generateGhostStones()` - Create 4 hint positions

## Board History Implementation

`@sabaki/go-board` uses immutability. Each `makeMove()` returns a new board instance without mutating the original. We exploit this for instant navigation.

```javascript
class GameManager {
  constructor(moves) {
    this.moves = moves
    this.boardHistory = [Board.fromDimensions(19)]
    this.studyPosition = 0
  }

  studyNext() {
    const move = this.moves[this.studyPosition]
    const newBoard = this.currentBoard.makeMove(sign, [x, y])
    this.boardHistory.push(newBoard)
    this.studyPosition++
  }

  studyPrev() {
    this.studyPosition--
  }

  get currentBoard() {
    return this.boardHistory[this.studyPosition]
  }
}
```

**Benefits:**
- Forward/backward navigation is O(1) array lookup
- Captures handled automatically by `go-board`
- Ko detection works correctly
- Memory cost: ~100KB for 147-move game

## Study Phase Behavior

### Visual Elements
- Board displays current position from `boardHistory[studyPosition]`
- Circle marker on last placed stone (using `markerMap`)
- Visual progress bar: `[████████░░░░░░░] 42 / 147`

### Input Controls
- **Buttons:** Previous, Next
- **Keyboard:** Arrow keys
- **Mouse:** Scroll wheel
- **Board:** Locked (no vertex clicks)

### Navigation
Forward navigation builds board history:
```
studyNext() → Create new board → Push to boardHistory → Increment position
```

Backward navigation references existing history:
```
studyPrev() → Decrement position → Read boardHistory[position]
```

### Animation
- **Forward:** Stones slide into place (`animateStonePlacement: true`)
- **Backward:** Stones disappear instantly (Shudan limitation)

Shudan's `diffSignMap` only detects stones being added (empty → stone), not removed (stone → empty). This is standard behavior in Go software.

## Replay Phase Behavior

### Input
- **Click only** - No keyboard, no scroll
- User clicks board to place stones

### Correct Move
1. Stone appears with placement animation
2. Circle marker shows on placed stone
3. Progress continues to next move

### Progressive Hints (Wrong Moves)

**First Wrong Attempt:**
- Display quadrant hint text: "Try the upper right quadrant"
- Highlight quadrant area on board (using `paintMap`)
- Quadrant calculation:
  - x < 9.5: "left", otherwise "right"
  - y < 9.5: "upper", otherwise "lower"

**Second Wrong Attempt:**
- Generate 4 ghost stones: 1 correct + 3 decoys
- Decoys placed randomly within ±4 spaces of correct position
- Display using `ghostStoneMap`
- User clicks ghost stones:
  - **Wrong ghost:** Mark with X → Wait 1s → Remove ghost from board
  - **Correct ghost:** Place stone → Continue game
- Process of elimination guides user to answer

**Third Wrong Attempt:**
- Show ghost stone with triangle marker on correct position
- User must click correct position to place stone and continue

### Hint Generation Algorithm

Port existing Lua algorithm:

```javascript
generateGhostStones() {
  const correct = this.moves[this.replayPosition]
  const options = [{ x: correct.x, y: correct.y, isCorrect: true }]

  let attempts = 0
  while (options.length < 4 && attempts < 100) {
    const dx = randomInt(-4, 4)
    const dy = randomInt(-4, 4)
    const newX = correct.x + dx
    const newY = correct.y + dy

    if (this.isValidHintPosition(newX, newY, options)) {
      options.push({ x: newX, y: newY, isCorrect: false })
    }
    attempts++
  }

  return options
}

isValidHintPosition(x, y, existing) {
  if (x < 0 || x > 18 || y < 0 || y > 18) return false
  if (this.currentBoard.get([x, y]) !== 0) return false
  if (existing.some(opt => opt.x === x && opt.y === y)) return false
  return true
}
```

## Complete Phase

Display three statistics:
1. **Total time** - Time from replay start to completion
2. **Average time per move** - Total time ÷ number of moves
3. **Wrong move count** - Total wrong attempts across all moves

Actions:
- **Retry Same Game** - Reset to study phase with same SGF
- **Upload New Game** - Return to upload phase

## React Integration

### useGameManager Hook

```javascript
function useGameManager(sgfMoves) {
  const [manager] = useState(() => new GameManager(sgfMoves))
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  const wrappedManager = useMemo(() => ({
    ...manager,

    studyNext() {
      const result = manager.studyNext()
      forceUpdate()
      return result
    },

    studyPrev() {
      const result = manager.studyPrev()
      forceUpdate()
      return result
    },

    validateMove(x, y) {
      const result = manager.validateMove(x, y)
      forceUpdate()
      return result
    }
  }), [manager])

  return wrappedManager
}
```

Component wraps all mutating methods to trigger React re-renders. GameManager remains pure JavaScript with no React dependencies.

### Component Usage

```javascript
function StudyPhase() {
  const game = useGameManager(moves)

  return (
    <>
      <ProgressBar current={game.studyPosition} total={game.moves.length} />
      <Goban
        signMap={game.getCurrentBoard().signMap}
        markerMap={getMarkerMap(game.lastMove)}
        animateStonePlacement={true}
        fuzzyStonePlacement={true}
        showCoordinates={true}
        vertexSize={34}
        busy={true}
      />
      <button onClick={() => game.studyPrev()}>Previous</button>
      <button onClick={() => game.studyNext()}>Next</button>
    </>
  )
}
```

## Data Flow

### Study Phase Navigation

```
User clicks Next
  ↓
game.studyNext()
  ↓
Create new board: currentBoard.makeMove(sign, vertex)
  ↓
Push to boardHistory
  ↓
Increment studyPosition
  ↓
forceUpdate() triggers re-render
  ↓
Component reads getCurrentBoard().signMap
  ↓
Shudan renders board with animation
```

### Replay Phase (Correct Move)

```
User clicks vertex [x, y]
  ↓
game.validateMove(x, y)
  ↓
Compare with moves[replayPosition]
  ↓
Match → currentBoard.makeMove(sign, [x, y])
  ↓
Push to boardHistory
  ↓
Increment replayPosition
  ↓
Update stats.correctFirstTry
  ↓
forceUpdate() → Re-render with animation
```

### Replay Phase (Wrong Move)

```
User clicks wrong vertex
  ↓
wrongAttempts++ for current move
  ↓
Return hint based on attempt count:
  - Attempt 1: { needHint: true, hintType: 'quadrant', quadrant: 'upper right' }
  - Attempt 2: { needHint: true, hintType: 'ghost', ghostStones: [...] }
  - Attempt 3: { needHint: true, hintType: 'triangle', position: [x, y] }
  ↓
Component renders appropriate hint UI
  ↓
User interacts with hints until correct
```

## Migration Plan

### Phase 1: Install Dependencies
```bash
npm install @sabaki/go-board
```

### Phase 2: Implement GameManager
Create new files in `src/game/`:
1. Write `GameManager.js` with all game logic
2. Write unit tests for GameManager
3. Write `useGameManager.js` hook
4. Write `constants.js` for phase names and quadrant logic

### Phase 3: Update Components
1. Create `ProgressBar.jsx`
2. Modify `StudyPhase.jsx` to use `useGameManager`
3. Modify `ReplayPhase.jsx` with progressive hint UI
4. Update `App.jsx` to remove Lua initialization

### Phase 4: Remove Lua
1. Delete `src/lua/` directory
2. Delete `src/lib/lua-bridge.js`
3. Remove `fengari-web` from `package.json`
4. Update imports in `App.jsx`

### Phase 5: Testing
1. Test study navigation with all input methods
2. Test replay with all three hint types
3. Test ghost stone elimination
4. Test complete phase statistics
5. Verify with 147-move SGF file

## Technical Notes

### Coordinate Systems
Both JavaScript and `@sabaki/go-board` use 0-based indexing. No conversion needed.

### Memory Usage
Storing 150 board instances (19×19 integers each):
- 150 boards × 361 integers × 4 bytes ≈ 216 KB
- Negligible for modern browsers

### Animation Behavior
Shudan's `animateStonePlacement` requires `fuzzyStonePlacement: true`. Animation duration defaults to 200ms, configurable via `animationDuration` prop.

## Success Criteria

1. Study phase navigation works forward and backward
2. Captured stones disappear from board automatically
3. Replay phase shows progressive hints correctly
4. Ghost stone elimination works (X marker, 1s delay, removal)
5. Statistics calculate accurately
6. No Lua dependencies remain in codebase
7. Application runs in production build without errors
