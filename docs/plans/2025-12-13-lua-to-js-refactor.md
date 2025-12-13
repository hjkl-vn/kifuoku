# Lua to JavaScript Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Lua game logic with JavaScript using @sabaki/go-board for proper capture handling

**Architecture:** MVC pattern with GameManager class (Model), React components (View), useGameManager hook (Controller). GameManager wraps @sabaki/go-board and maintains immutable board history for instant navigation.

**Tech Stack:** @sabaki/go-board, React hooks, JavaScript ES6+ classes

---

## Task 1: Install Dependencies

**Files:**
- Modify: `go-memory-game/package.json`

**Step 1: Install @sabaki/go-board**

```bash
cd go-memory-game
npm install @sabaki/go-board
```

Expected: Package added to dependencies in package.json

**Step 2: Verify installation**

```bash
npm list @sabaki/go-board
```

Expected: Shows installed version

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add @sabaki/go-board dependency

Install go-board library for board state management and capture
detection.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create Constants

**Files:**
- Create: `go-memory-game/src/game/constants.js`

**Step 1: Create constants file**

```javascript
export const PHASES = {
  UPLOAD: 'upload',
  STUDY: 'study',
  REPLAY: 'replay',
  COMPLETE: 'complete'
}

export const HINT_TYPES = {
  QUADRANT: 'quadrant',
  GHOST: 'ghost',
  TRIANGLE: 'triangle'
}

export function getQuadrant(x, y) {
  const horizontal = x < 9.5 ? 'left' : 'right'
  const vertical = y < 9.5 ? 'upper' : 'lower'
  return `${vertical} ${horizontal}`
}

export function getQuadrantVertices(quadrant) {
  const vertices = []

  const [vertical, horizontal] = quadrant.split(' ')
  const xRange = horizontal === 'left' ? [0, 9] : [10, 18]
  const yRange = vertical === 'upper' ? [0, 9] : [10, 18]

  for (let y = yRange[0]; y <= yRange[1]; y++) {
    for (let x = xRange[0]; x <= xRange[1]; x++) {
      vertices.push([x, y])
    }
  }

  return vertices
}

export function colorToSign(color) {
  if (color === 'B') return 1
  if (color === 'W') return -1
  return 0
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
```

**Step 2: Verify file structure**

```bash
ls -la go-memory-game/src/game/
```

Expected: Directory exists with constants.js

**Step 3: Commit**

```bash
git add src/game/constants.js
git commit -m "feat: add game constants and utilities

Define phase names, hint types, and helper functions for quadrant
calculation and coordinate conversion.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Create GameManager Class (Part 1 - Constructor)

**Files:**
- Create: `go-memory-game/src/game/GameManager.js`
- Create: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Create test directory**

```bash
mkdir -p go-memory-game/src/game/__tests__
```

**Step 2: Write failing test for constructor**

Create `src/game/__tests__/GameManager.test.js`:

```javascript
import { describe, it, expect } from 'vitest'
import GameManager from '../GameManager'

describe('GameManager', () => {
  const mockMoves = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 15, color: 'W' },
    { x: 3, y: 15, color: 'B' }
  ]

  describe('constructor', () => {
    it('initializes with correct default state', () => {
      const manager = new GameManager(mockMoves)

      expect(manager.phase).toBe('study')
      expect(manager.moves).toEqual(mockMoves)
      expect(manager.studyPosition).toBe(0)
      expect(manager.replayPosition).toBe(0)
      expect(manager.boardHistory).toHaveLength(1)
      expect(manager.stats.wrongMoveCount).toBe(0)
      expect(manager.stats.correctFirstTry).toBe(0)
    })

    it('creates empty 19x19 board as initial state', () => {
      const manager = new GameManager(mockMoves)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.width).toBe(19)
      expect(initialBoard.height).toBe(19)
      expect(initialBoard.isEmpty()).toBe(true)
    })
  })
})
```

**Step 3: Install Vitest**

```bash
cd go-memory-game
npm install -D vitest
```

**Step 4: Add test script to package.json**

Add to scripts section:
```json
"test": "vitest"
```

**Step 5: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "Cannot find module '../GameManager'"

**Step 6: Write minimal implementation**

Create `src/game/GameManager.js`:

```javascript
import Board from '@sabaki/go-board'
import { PHASES, colorToSign } from './constants'

export default class GameManager {
  constructor(moves) {
    this.moves = moves
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0
    this.boardHistory = [Board.fromDimensions(19, 19)]
    this.wrongAttemptsCurrentMove = 0

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      ghostHintsUsed: 0,
      triangleHintsUsed: 0,
      startTime: null,
      moveTimes: []
    }
  }

  getCurrentBoard() {
    return this.boardHistory[this.studyPosition]
  }

  getState() {
    return {
      phase: this.phase,
      studyPosition: this.studyPosition,
      replayPosition: this.replayPosition,
      totalMoves: this.moves.length,
      boardState: this.getCurrentBoard().signMap,
      stats: { ...this.stats }
    }
  }
}
```

**Step 7: Run test to verify it passes**

```bash
npm test
```

Expected: PASS (all tests green)

**Step 8: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js package.json package-lock.json
git commit -m "feat: add GameManager constructor

Initialize GameManager with moves, board history, and statistics
tracking.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: GameManager - Study Phase Methods

**Files:**
- Modify: `go-memory-game/src/game/GameManager.js`
- Modify: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test for studyNext**

Add to `GameManager.test.js`:

```javascript
describe('Study Phase', () => {
  it('studyNext advances position and updates board', () => {
    const manager = new GameManager(mockMoves)

    const result = manager.studyNext()

    expect(result.success).toBe(true)
    expect(manager.studyPosition).toBe(1)
    expect(manager.boardHistory).toHaveLength(2)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
  })

  it('studyNext returns atEnd when at last move', () => {
    const manager = new GameManager(mockMoves)
    manager.studyNext()
    manager.studyNext()
    manager.studyNext()

    const result = manager.studyNext()

    expect(result.atEnd).toBe(true)
    expect(manager.studyPosition).toBe(3)
  })

  it('studyPrev decrements position', () => {
    const manager = new GameManager(mockMoves)
    manager.studyNext()
    manager.studyNext()

    const result = manager.studyPrev()

    expect(result.success).toBe(true)
    expect(manager.studyPosition).toBe(1)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
    expect(manager.getCurrentBoard().get([15, 15])).toBe(0)
  })

  it('studyPrev returns atStart when at beginning', () => {
    const manager = new GameManager(mockMoves)

    const result = manager.studyPrev()

    expect(result.atStart).toBe(true)
    expect(manager.studyPosition).toBe(0)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "manager.studyNext is not a function"

**Step 3: Implement study methods**

Add to `GameManager.js`:

```javascript
studyNext() {
  if (this.studyPosition >= this.moves.length) {
    return { atEnd: true, position: this.studyPosition }
  }

  const move = this.moves[this.studyPosition]
  const sign = colorToSign(move.color)
  const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])

  this.boardHistory.push(newBoard)
  this.studyPosition++

  return {
    success: true,
    position: this.studyPosition,
    move: move
  }
}

studyPrev() {
  if (this.studyPosition === 0) {
    return { atStart: true, position: 0 }
  }

  this.studyPosition--

  return {
    success: true,
    position: this.studyPosition
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add study phase navigation methods

Implement studyNext and studyPrev for forward/backward navigation
through move history.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: GameManager - Start Replay Method

**Files:**
- Modify: `go-memory-game/src/game/GameManager.js`
- Modify: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test**

Add to `GameManager.test.js`:

```javascript
describe('Phase Transitions', () => {
  it('startReplay transitions to replay phase and resets board', () => {
    const manager = new GameManager(mockMoves)
    manager.studyNext()
    manager.studyNext()

    const result = manager.startReplay()

    expect(result.success).toBe(true)
    expect(manager.phase).toBe('replay')
    expect(manager.replayPosition).toBe(0)
    expect(manager.getCurrentBoard().isEmpty()).toBe(true)
    expect(manager.stats.startTime).not.toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "manager.startReplay is not a function"

**Step 3: Implement startReplay**

Add to `GameManager.js`:

```javascript
startReplay() {
  this.phase = PHASES.REPLAY
  this.replayPosition = 0
  this.studyPosition = 0
  this.wrongAttemptsCurrentMove = 0
  this.stats.startTime = Date.now()
  this.stats.wrongMoveCount = 0
  this.stats.correctFirstTry = 0
  this.stats.moveTimes = []

  return {
    success: true,
    phase: this.phase
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add startReplay phase transition

Reset board and statistics when starting replay phase.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: GameManager - Hint Generation

**Files:**
- Modify: `go-memory-game/src/game/GameManager.js`
- Modify: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test**

Add to `GameManager.test.js`:

```javascript
import { getQuadrant } from '../constants'

describe('Hint Generation', () => {
  it('generateGhostStones returns 4 positions with 1 correct', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    const ghosts = manager.generateGhostStones()

    expect(ghosts).toHaveLength(4)
    expect(ghosts.filter(g => g.isCorrect)).toHaveLength(1)

    const correctGhost = ghosts.find(g => g.isCorrect)
    expect(correctGhost.x).toBe(mockMoves[0].x)
    expect(correctGhost.y).toBe(mockMoves[0].y)
  })

  it('ghost positions are valid and unique', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    const ghosts = manager.generateGhostStones()

    ghosts.forEach(ghost => {
      expect(ghost.x).toBeGreaterThanOrEqual(0)
      expect(ghost.x).toBeLessThan(19)
      expect(ghost.y).toBeGreaterThanOrEqual(0)
      expect(ghost.y).toBeLessThan(19)
    })

    const positions = ghosts.map(g => `${g.x},${g.y}`)
    const uniquePositions = new Set(positions)
    expect(uniquePositions.size).toBe(4)
  })

  it('getQuadrantHint returns correct quadrant', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    const hint = manager.getQuadrantHint()

    expect(hint.quadrant).toBe(getQuadrant(mockMoves[0].x, mockMoves[0].y))
    expect(hint.vertices).toBeDefined()
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "manager.generateGhostStones is not a function"

**Step 3: Implement hint generation methods**

Add to `GameManager.js`:

```javascript
import { PHASES, colorToSign, getQuadrant, getQuadrantVertices, randomInt } from './constants'

generateGhostStones() {
  if (this.replayPosition >= this.moves.length) {
    return []
  }

  const correctMove = this.moves[this.replayPosition]
  const options = [{
    x: correctMove.x,
    y: correctMove.y,
    isCorrect: true
  }]

  let attempts = 0
  while (options.length < 4 && attempts < 100) {
    const dx = randomInt(-4, 4)
    const dy = randomInt(-4, 4)

    if (dx === 0 && dy === 0) {
      attempts++
      continue
    }

    const newX = correctMove.x + dx
    const newY = correctMove.y + dy

    if (this.isValidHintPosition(newX, newY, options)) {
      options.push({
        x: newX,
        y: newY,
        isCorrect: false
      })
    }

    attempts++
  }

  return options
}

isValidHintPosition(x, y, existingOptions) {
  if (x < 0 || x > 18 || y < 0 || y > 18) {
    return false
  }

  if (this.getCurrentBoard().get([x, y]) !== 0) {
    return false
  }

  if (existingOptions.some(opt => opt.x === x && opt.y === y)) {
    return false
  }

  return true
}

getQuadrantHint() {
  const correctMove = this.moves[this.replayPosition]
  const quadrant = getQuadrant(correctMove.x, correctMove.y)
  const vertices = getQuadrantVertices(quadrant)

  return {
    quadrant,
    vertices
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add hint generation methods

Implement ghost stone generation and quadrant hint calculation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: GameManager - Move Validation

**Files:**
- Modify: `go-memory-game/src/game/GameManager.js`
- Modify: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test**

Add to `GameManager.test.js`:

```javascript
describe('Move Validation', () => {
  it('validates correct move on first try', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    const result = manager.validateMove(3, 3)

    expect(result.correct).toBe(true)
    expect(result.needHint).toBe(false)
    expect(manager.replayPosition).toBe(1)
    expect(manager.stats.correctFirstTry).toBe(1)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
  })

  it('returns quadrant hint on first wrong attempt', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    const result = manager.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.needHint).toBe(true)
    expect(result.hintType).toBe('quadrant')
    expect(result.quadrant).toBeDefined()
    expect(manager.stats.quadrantHintsUsed).toBe(1)
    expect(manager.wrongAttemptsCurrentMove).toBe(1)
  })

  it('returns ghost stones on second wrong attempt', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    manager.validateMove(10, 10)
    const result = manager.validateMove(10, 11)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('ghost')
    expect(result.ghostStones).toHaveLength(4)
    expect(manager.stats.ghostHintsUsed).toBe(1)
  })

  it('returns triangle hint on third wrong attempt', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    manager.validateMove(10, 10)
    manager.validateMove(10, 11)
    const result = manager.validateMove(10, 12)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('triangle')
    expect(result.correctPosition).toEqual({ x: 3, y: 3 })
    expect(manager.stats.triangleHintsUsed).toBe(1)
  })

  it('transitions to complete when all moves done', () => {
    const manager = new GameManager([{ x: 3, y: 3, color: 'B' }])
    manager.startReplay()

    const result = manager.validateMove(3, 3)

    expect(result.correct).toBe(true)
    expect(result.gameComplete).toBe(true)
    expect(manager.phase).toBe('complete')
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "manager.validateMove is not a function"

**Step 3: Implement validateMove**

Add to `GameManager.js`:

```javascript
import { PHASES, HINT_TYPES, colorToSign, getQuadrant, getQuadrantVertices, randomInt } from './constants'

validateMove(x, y) {
  if (this.phase !== PHASES.REPLAY) {
    return { error: 'Not in replay phase' }
  }

  if (this.replayPosition >= this.moves.length) {
    return { error: 'All moves completed' }
  }

  const correctMove = this.moves[this.replayPosition]
  const isCorrect = correctMove.x === x && correctMove.y === y

  if (isCorrect) {
    const sign = colorToSign(correctMove.color)
    const newBoard = this.getCurrentBoard().makeMove(sign, [x, y])
    this.boardHistory.push(newBoard)
    this.studyPosition++

    if (this.wrongAttemptsCurrentMove === 0) {
      this.stats.correctFirstTry++
    }

    const moveTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
    this.stats.moveTimes.push(moveTime)

    this.replayPosition++
    this.wrongAttemptsCurrentMove = 0

    if (this.replayPosition >= this.moves.length) {
      this.phase = PHASES.COMPLETE
      return {
        correct: true,
        gameComplete: true
      }
    }

    return {
      correct: true,
      needHint: false,
      currentMove: this.replayPosition
    }
  }

  this.wrongAttemptsCurrentMove++
  this.stats.wrongMoveCount++

  if (this.wrongAttemptsCurrentMove === 1) {
    this.stats.quadrantHintsUsed++
    const hint = this.getQuadrantHint()
    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.QUADRANT,
      quadrant: hint.quadrant,
      vertices: hint.vertices
    }
  }

  if (this.wrongAttemptsCurrentMove === 2) {
    this.stats.ghostHintsUsed++
    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.GHOST,
      ghostStones: this.generateGhostStones(),
      nextColor: correctMove.color
    }
  }

  this.stats.triangleHintsUsed++
  return {
    correct: false,
    needHint: true,
    hintType: HINT_TYPES.TRIANGLE,
    correctPosition: { x: correctMove.x, y: correctMove.y },
    nextColor: correctMove.color
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add move validation with progressive hints

Implement validateMove with three-tier hint system: quadrant, ghost
stones, triangle reveal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: GameManager - Ghost Stone Handling

**Files:**
- Modify: `go-memory-game/src/game/GameManager.js`
- Modify: `go-memory-game/src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test**

Add to `GameManager.test.js`:

```javascript
describe('Ghost Stone Interaction', () => {
  it('eliminates wrong ghost and returns remaining', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    manager.validateMove(10, 10)
    const ghostResult = manager.validateMove(10, 11)
    const ghosts = ghostResult.ghostStones
    const wrongGhost = ghosts.find(g => !g.isCorrect)

    const result = manager.handleGhostClick(wrongGhost.x, wrongGhost.y)

    expect(result.correct).toBe(false)
    expect(result.eliminated).toBe(true)
    expect(result.remainingGhosts).toHaveLength(3)
  })

  it('places stone when correct ghost clicked', () => {
    const manager = new GameManager(mockMoves)
    manager.startReplay()

    manager.validateMove(10, 10)
    const ghostResult = manager.validateMove(10, 11)
    const correctGhost = ghostResult.ghostStones.find(g => g.isCorrect)

    const result = manager.handleGhostClick(correctGhost.x, correctGhost.y)

    expect(result.correct).toBe(true)
    expect(manager.replayPosition).toBe(1)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

```bash
npm test
```

Expected: FAIL with "manager.handleGhostClick is not a function"

**Step 3: Implement handleGhostClick**

Add to `GameManager.js`:

```javascript
constructor(moves) {
  this.moves = moves
  this.phase = PHASES.STUDY
  this.studyPosition = 0
  this.replayPosition = 0
  this.boardHistory = [Board.fromDimensions(19, 19)]
  this.wrongAttemptsCurrentMove = 0
  this.currentGhostStones = []

  this.stats = {
    wrongMoveCount: 0,
    correctFirstTry: 0,
    quadrantHintsUsed: 0,
    ghostHintsUsed: 0,
    triangleHintsUsed: 0,
    startTime: null,
    moveTimes: []
  }
}

handleGhostClick(x, y) {
  const clickedGhost = this.currentGhostStones.find(g => g.x === x && g.y === y)

  if (!clickedGhost) {
    return { error: 'Invalid ghost position' }
  }

  if (clickedGhost.isCorrect) {
    const correctMove = this.moves[this.replayPosition]
    const sign = colorToSign(correctMove.color)
    const newBoard = this.getCurrentBoard().makeMove(sign, [x, y])
    this.boardHistory.push(newBoard)
    this.studyPosition++

    this.replayPosition++
    this.wrongAttemptsCurrentMove = 0
    this.currentGhostStones = []

    return {
      correct: true,
      currentMove: this.replayPosition
    }
  }

  this.currentGhostStones = this.currentGhostStones.filter(g => g.x !== x || g.y !== y)

  return {
    correct: false,
    eliminated: true,
    remainingGhosts: this.currentGhostStones
  }
}
```

Update validateMove to store ghost stones:

```javascript
if (this.wrongAttemptsCurrentMove === 2) {
  this.stats.ghostHintsUsed++
  this.currentGhostStones = this.generateGhostStones()
  return {
    correct: false,
    needHint: true,
    hintType: HINT_TYPES.GHOST,
    ghostStones: this.currentGhostStones,
    nextColor: correctMove.color
  }
}
```

**Step 4: Run test to verify it passes**

```bash
npm test
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add ghost stone click handling

Implement process of elimination for ghost stones with click
validation.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Create useGameManager Hook

**Files:**
- Create: `go-memory-game/src/game/useGameManager.js`

**Step 1: Create hook file**

```javascript
import { useState, useMemo, useReducer } from 'react'
import GameManager from './GameManager'

export default function useGameManager(sgfMoves) {
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

    startReplay() {
      const result = manager.startReplay()
      forceUpdate()
      return result
    },

    validateMove(x, y) {
      const result = manager.validateMove(x, y)
      forceUpdate()
      return result
    },

    handleGhostClick(x, y) {
      const result = manager.handleGhostClick(x, y)
      forceUpdate()
      return result
    },

    getCurrentBoard() {
      return manager.getCurrentBoard()
    },

    getState() {
      return manager.getState()
    }
  }), [manager])

  return wrappedManager
}
```

**Step 2: Verify file exists**

```bash
ls -la go-memory-game/src/game/useGameManager.js
```

Expected: File exists

**Step 3: Commit**

```bash
git add src/game/useGameManager.js
git commit -m "feat: add useGameManager React hook

Create hook wrapper for GameManager that triggers re-renders on state
changes.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Create ProgressBar Component

**Files:**
- Create: `go-memory-game/src/components/ProgressBar.jsx`

**Step 1: Create component file**

```javascript
import React from 'react'

export default function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div style={styles.container}>
      <div style={styles.barBackground}>
        <div style={{...styles.barFill, width: `${percentage}%`}} />
      </div>
      <div style={styles.text}>
        {current} / {total}
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: '20px'
  },
  barBackground: {
    width: '100%',
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    transition: 'width 0.3s ease'
  },
  text: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666'
  }
}
```

**Step 2: Verify file exists**

```bash
ls -la go-memory-game/src/components/ProgressBar.jsx
```

Expected: File exists

**Step 3: Commit**

```bash
git add src/components/ProgressBar.jsx
git commit -m "feat: add ProgressBar component

Create visual progress indicator for study and replay phases.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 11: Update StudyPhase Component

**Files:**
- Modify: `go-memory-game/src/components/StudyPhase.jsx`

**Step 1: Read current file**

Already done in previous context.

**Step 2: Replace with new implementation**

```javascript
import React, { useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'

export default function StudyPhase({ gameManager }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = state.studyPosition > 0
    ? gameManager.moves[state.studyPosition - 1]
    : null

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (canGoNext) gameManager.studyNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (canGoPrev) gameManager.studyPrev()
      }
    }

    const handleWheel = (e) => {
      if (e.deltaY > 0 && canGoNext) {
        gameManager.studyNext()
      } else if (e.deltaY < 0 && canGoPrev) {
        gameManager.studyPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('wheel', handleWheel)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('wheel', handleWheel)
    }
  }, [canGoNext, canGoPrev, gameManager])

  const markerMap = lastMove
    ? Array(19).fill(null).map(() => Array(19).fill(null))
    : null

  if (markerMap && lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Study Phase</h2>

      <ProgressBar current={state.studyPosition} total={state.totalMoves} />

      <div style={styles.boardContainer}>
        <Goban
          animateStonePlacement={true}
          busy={true}
          fuzzyStonePlacement={true}
          showCoordinates={true}
          signMap={board.signMap}
          markerMap={markerMap}
          vertexSize={34}
        />
      </div>

      <div style={styles.controls}>
        <button
          style={{
            ...styles.button,
            ...(canGoPrev ? {} : styles.buttonDisabled)
          }}
          onClick={() => gameManager.studyPrev()}
          disabled={!canGoPrev}
        >
          ← Previous
        </button>

        <button
          style={{
            ...styles.button,
            ...(canGoNext ? {} : styles.buttonDisabled)
          }}
          onClick={() => gameManager.studyNext()}
          disabled={!canGoNext}
        >
          Next →
        </button>
      </div>

      {!canGoNext && state.studyPosition > 0 && (
        <div style={styles.readySection}>
          <p style={styles.readyText}>
            You've reviewed all {state.totalMoves} moves.
          </p>
          <button
            style={styles.startButton}
            onClick={() => gameManager.startReplay()}
          >
            Start Replay Challenge
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '10px'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  readySection: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px'
  },
  readyText: {
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  startButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
}
```

**Step 3: Verify syntax**

```bash
cd go-memory-game
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "refactor: update StudyPhase to use GameManager

Replace Lua calls with GameManager. Add keyboard and scroll
navigation. Add progress bar and circle marker.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 12: Update ReplayPhase Component

**Files:**
- Modify: `go-memory-game/src/components/ReplayPhase.jsx`

**Step 1: Replace with new implementation**

```javascript
import React, { useState, useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import { colorToSign } from '../game/constants'

export default function ReplayPhase({ gameManager }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedGhosts, setEliminatedGhosts] = useState([])
  const [feedback, setFeedback] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = state.studyPosition > 0
    ? gameManager.moves[state.studyPosition - 1]
    : null

  useEffect(() => {
    if (state.phase === 'complete') {
      onComplete()
    }
  }, [state.phase])

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return

    if (hintState?.hintType === 'ghost') {
      const clickResult = gameManager.handleGhostClick(x, y)

      if (clickResult.error) return

      if (clickResult.correct) {
        setHintState(null)
        setEliminatedGhosts([])
        setFeedback({ type: 'success', message: 'Correct!' })
        setTimeout(() => setFeedback(null), 1000)
      } else {
        setEliminatedGhosts(prev => [...prev, { x, y }])
        setTimeout(() => {
          setEliminatedGhosts(prev => prev.filter(g => g.x !== x || g.y !== y))
        }, 1000)
      }
      return
    }

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setFeedback({ type: 'success', message: 'Correct!' })
      setTimeout(() => setFeedback(null), 1000)

      if (result.gameComplete) {
        setTimeout(() => onComplete(), 1500)
      }
    } else if (result.needHint) {
      setHintState(result)
      setFeedback({ type: 'error', message: 'Wrong move!' })
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  const onComplete = () => {
    alert('Game Complete!')
  }

  const markerMap = Array(19).fill(null).map(() => Array(19).fill(null))

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  const ghostStoneMap = Array(19).fill(null).map(() => Array(19).fill(null))
  const paintMap = Array(19).fill(null).map(() => Array(19).fill(null))

  if (hintState?.hintType === 'quadrant' && hintState.vertices) {
    hintState.vertices.forEach(([x, y]) => {
      paintMap[y][x] = 1
    })
  }

  if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
    const sign = colorToSign(hintState.nextColor)
    hintState.ghostStones.forEach(ghost => {
      ghostStoneMap[ghost.y][ghost.x] = { sign, faint: false }

      const isEliminated = eliminatedGhosts.some(g => g.x === ghost.x && g.y === ghost.y)
      if (isEliminated) {
        markerMap[ghost.y][ghost.x] = { type: 'cross' }
      }
    })
  }

  if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
    const { x, y } = hintState.correctPosition
    const sign = colorToSign(hintState.nextColor)
    ghostStoneMap[y][x] = { sign, faint: false }
    markerMap[y][x] = { type: 'triangle' }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Replay Challenge</h2>

      <div style={styles.stats}>
        <span>Correct: {state.stats.correctFirstTry}</span>
        <span>Wrong: {state.stats.wrongMoveCount}</span>
      </div>

      <ProgressBar current={state.replayPosition} total={state.totalMoves} />

      {feedback && (
        <div style={{
          ...styles.feedback,
          ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError)
        }}>
          {feedback.message}
        </div>
      )}

      {hintState?.hintType === 'quadrant' && (
        <div style={styles.hint}>
          Try the {hintState.quadrant} quadrant
        </div>
      )}

      <div style={styles.boardContainer}>
        <Goban
          animateStonePlacement={true}
          busy={false}
          fuzzyStonePlacement={true}
          showCoordinates={true}
          signMap={board.signMap}
          markerMap={markerMap}
          ghostStoneMap={ghostStoneMap}
          paintMap={paintMap}
          vertexSize={34}
          onVertexClick={handleVertexClick}
        />
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '10px'
  },
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  feedback: {
    textAlign: 'center',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  feedbackSuccess: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32'
  },
  feedbackError: {
    backgroundColor: '#ffcdd2',
    color: '#c62828'
  },
  hint: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '5px',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center'
  }
}
```

**Step 2: Verify syntax**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "refactor: update ReplayPhase with progressive hints

Implement three-tier hint system with quadrant highlighting, ghost
stone elimination, and triangle reveal.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 13: Update App.jsx

**Files:**
- Modify: `go-memory-game/src/App.jsx`

**Step 1: Replace App.jsx implementation**

```javascript
import React, { useState } from 'react'
import { parseSGFToMoves, getBoardSize } from './lib/sgf-parser.js'
import useGameManager from './game/useGameManager'
import UploadPhase from './components/UploadPhase.jsx'
import StudyPhase from './components/StudyPhase.jsx'
import ReplayPhase from './components/ReplayPhase.jsx'

export default function App() {
  const [moves, setMoves] = useState(null)
  const [error, setError] = useState(null)
  const gameManager = moves ? useGameManager(moves) : null

  const handleFileLoaded = (sgfContent) => {
    try {
      const boardSize = getBoardSize(sgfContent)
      if (boardSize !== 19) {
        setError('Only 19×19 boards are supported')
        return
      }

      const parsedMoves = parseSGFToMoves(sgfContent)
      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      setMoves(parsedMoves)
      setError(null)
    } catch (err) {
      setError(`Failed to load game: ${err.message}`)
    }
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!gameManager) {
    return <UploadPhase onFileLoaded={handleFileLoaded} />
  }

  const state = gameManager.getState()

  if (state.phase === 'study') {
    return <StudyPhase gameManager={gameManager} />
  }

  if (state.phase === 'replay') {
    return <ReplayPhase gameManager={gameManager} />
  }

  if (state.phase === 'complete') {
    const totalTime = state.stats.moveTimes.reduce((sum, t) => sum + t, 0)
    const avgTime = totalTime / state.stats.moveTimes.length

    return (
      <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'sans-serif' }}>
        <h1>Game Complete!</h1>
        <div style={{ fontSize: '18px', marginTop: '30px' }}>
          <p>Total Time: {(totalTime / 1000).toFixed(1)}s</p>
          <p>Average Time per Move: {(avgTime / 1000).toFixed(1)}s</p>
          <p>Wrong Moves: {state.stats.wrongMoveCount}</p>
        </div>
        <button
          onClick={() => {
            gameManager.phase = 'study'
            gameManager.studyPosition = 0
            gameManager.replayPosition = 0
          }}
          style={{
            marginTop: '30px',
            padding: '15px 40px',
            fontSize: '18px',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  return null
}
```

**Step 2: Verify build**

```bash
npm run build
```

Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/App.jsx
git commit -m "refactor: update App to use GameManager

Remove Lua initialization. Use useGameManager hook for game state.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 14: Remove Lua Dependencies

**Files:**
- Delete: `go-memory-game/src/lua/`
- Delete: `go-memory-game/src/lib/lua-bridge.js`
- Modify: `go-memory-game/package.json`

**Step 1: Delete Lua files**

```bash
rm -rf go-memory-game/src/lua/
rm go-memory-game/src/lib/lua-bridge.js
```

**Step 2: Remove fengari from package.json**

```bash
npm uninstall fengari-web
```

**Step 3: Verify build still works**

```bash
npm run build
```

Expected: Build succeeds

**Step 4: Commit**

```bash
git add -A
git commit -m "refactor: remove Lua and Fengari dependencies

Delete lua/ directory, lua-bridge.js, and fengari-web package.
All game logic now in JavaScript.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 15: Final Testing

**Files:**
- None (testing only)

**Step 1: Run all tests**

```bash
npm test
```

Expected: All tests pass

**Step 2: Build production bundle**

```bash
npm run build
```

Expected: Build succeeds without errors

**Step 3: Test development server**

```bash
npm run dev
```

**Step 4: Manual testing checklist**

Test in browser at http://localhost:3000:

1. Upload SGF file (use sgf/sample.sgf)
2. Study Phase:
   - Click Next button - stone should animate in
   - Click Previous button - stone should disappear
   - Press arrow keys - navigation should work
   - Scroll mouse wheel - navigation should work
   - Check progress bar updates
   - Check circle marker on last move
3. Click "Start Replay Challenge"
4. Replay Phase:
   - Click wrong position - should show quadrant hint
   - Click wrong again - should show 4 ghost stones
   - Click wrong ghost - should show X, wait 1s, disappear
   - Click correct ghost - should place stone and continue
   - Click wrong 3 times - should show triangle
   - Check progress bar updates
   - Check statistics update
5. Complete all moves
6. Complete Phase:
   - Verify statistics shown
   - Click Retry button

**Step 5: Verify captures work**

If sample.sgf has captures, verify stones disappear when captured.

**Step 6: Final commit**

```bash
git add -A
git commit -m "test: verify all functionality works

Manual testing completed:
- Study navigation (buttons, keyboard, scroll)
- Replay progressive hints
- Ghost stone elimination
- Capture detection
- Statistics tracking

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Success Criteria

- ✅ All unit tests pass
- ✅ Production build succeeds
- ✅ Study navigation works with all input methods
- ✅ Progressive hints appear correctly
- ✅ Ghost stone elimination works
- ✅ Captured stones disappear automatically
- ✅ Statistics calculate correctly
- ✅ No Lua dependencies remain
- ✅ Application runs in production without errors

## Notes

- Add Vitest configuration if needed: Create `vitest.config.js`
- If tests need DOM: Install @testing-library/react
- GameManager is pure JavaScript - can be tested without React
- Components tested manually (integration tests)
- Use TDD throughout - write test first, implement after
