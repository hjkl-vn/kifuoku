# Progressive Subdivision Hints Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace A/B/C/D multiple choice hints with binary-search style subdivision that progressively narrows down the search area.

**Architecture:** Each wrong attempt subdivides the highlighted region into quarters, showing the quadrant containing the correct move. When region reaches ≤3×3, show exact point with triangle marker. State tracked via `currentHintRegion` bounds object.

**Tech Stack:** JavaScript, Vitest, React

---

### Task 1: Add Subdivision Helper Functions to Constants

**Files:**
- Modify: `src/game/constants.js`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write failing tests for helper functions**

Add to `src/game/__tests__/GameManager.test.js`:

```javascript
import {
  getQuadrantBounds,
  getSubQuadrant,
  isRegionSmallEnough
} from '../constants'

describe('getQuadrantBounds', () => {
  it('returns upper-left quadrant for move in upper-left', () => {
    const bounds = getQuadrantBounds({ x: 3, y: 3 }, 19)
    expect(bounds).toEqual({ minX: 0, maxX: 8, minY: 0, maxY: 8 })
  })

  it('returns lower-right quadrant for move in lower-right', () => {
    const bounds = getQuadrantBounds({ x: 15, y: 15 }, 19)
    expect(bounds).toEqual({ minX: 9, maxX: 18, minY: 9, maxY: 18 })
  })

  it('returns upper-right quadrant for move in upper-right', () => {
    const bounds = getQuadrantBounds({ x: 12, y: 4 }, 19)
    expect(bounds).toEqual({ minX: 9, maxX: 18, minY: 0, maxY: 8 })
  })

  it('returns lower-left quadrant for move in lower-left', () => {
    const bounds = getQuadrantBounds({ x: 4, y: 12 }, 19)
    expect(bounds).toEqual({ minX: 0, maxX: 8, minY: 9, maxY: 18 })
  })
})

describe('getSubQuadrant', () => {
  it('subdivides region to upper-left sub-quadrant', () => {
    const region = { minX: 0, maxX: 8, minY: 0, maxY: 8 }
    const subRegion = getSubQuadrant(region, { x: 2, y: 2 })
    expect(subRegion).toEqual({ minX: 0, maxX: 4, minY: 0, maxY: 4 })
  })

  it('subdivides region to lower-right sub-quadrant', () => {
    const region = { minX: 0, maxX: 8, minY: 0, maxY: 8 }
    const subRegion = getSubQuadrant(region, { x: 7, y: 7 })
    expect(subRegion).toEqual({ minX: 5, maxX: 8, minY: 5, maxY: 8 })
  })

  it('subdivides small region correctly', () => {
    const region = { minX: 0, maxX: 4, minY: 0, maxY: 4 }
    const subRegion = getSubQuadrant(region, { x: 1, y: 3 })
    expect(subRegion).toEqual({ minX: 0, maxX: 2, minY: 3, maxY: 4 })
  })
})

describe('isRegionSmallEnough', () => {
  it('returns true for 3x3 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 2, minY: 0, maxY: 2 })).toBe(true)
  })

  it('returns true for 2x2 region', () => {
    expect(isRegionSmallEnough({ minX: 5, maxX: 6, minY: 5, maxY: 6 })).toBe(true)
  })

  it('returns false for 4x4 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 3, minY: 0, maxY: 3 })).toBe(false)
  })

  it('returns false for 3x4 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 2, minY: 0, maxY: 3 })).toBe(false)
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL with import errors (functions don't exist)

**Step 3: Implement helper functions**

Add to `src/game/constants.js`:

```javascript
export function getQuadrantBounds(move, boardSize) {
  const midX = Math.floor(boardSize / 2)
  const midY = Math.floor(boardSize / 2)
  return {
    minX: move.x < midX ? 0 : midX,
    maxX: move.x < midX ? midX - 1 : boardSize - 1,
    minY: move.y < midY ? 0 : midY,
    maxY: move.y < midY ? midY - 1 : boardSize - 1
  }
}

export function getSubQuadrant(region, move) {
  const midX = Math.floor((region.minX + region.maxX) / 2)
  const midY = Math.floor((region.minY + region.maxY) / 2)
  return {
    minX: move.x <= midX ? region.minX : midX + 1,
    maxX: move.x <= midX ? midX : region.maxX,
    minY: move.y <= midY ? region.minY : midY + 1,
    maxY: move.y <= midY ? midY : region.maxY
  }
}

export function isRegionSmallEnough(region) {
  const width = region.maxX - region.minX + 1
  const height = region.maxY - region.minY + 1
  return width <= 3 && height <= 3
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/constants.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add subdivision helper functions"
```

---

### Task 2: Update HINT_TYPES and Remove Ghost Constants

**Files:**
- Modify: `src/game/constants.js`

**Step 1: Update HINT_TYPES enum**

In `src/game/constants.js`, change:

```javascript
export const HINT_TYPES = {
  QUADRANT: 'quadrant',
  GHOST: 'ghost',
  TRIANGLE: 'triangle'
}
```

To:

```javascript
export const HINT_TYPES = {
  QUADRANT: 'quadrant',
  EXACT: 'exact'
}
```

**Step 2: Remove ghost-related constants**

Remove these lines from `src/game/constants.js`:

```javascript
export const GHOST_HINT_COUNT = 4
export const MAX_GHOST_GENERATION_ATTEMPTS = 100
export const GHOST_HINT_RADIUS = 4
export const HINT_LETTERS = ['A', 'B', 'C', 'D']
```

**Step 3: Run tests to check for breakage**

Run: `npm test -- --run`
Expected: Some tests may fail if they reference removed constants (fix in later tasks)

**Step 4: Commit**

```bash
git add src/game/constants.js
git commit -m "refactor: update HINT_TYPES, remove ghost constants"
```

---

### Task 3: Update GameManager State and Constructor

**Files:**
- Modify: `src/game/GameManager.js`

**Step 1: Update imports**

In `src/game/GameManager.js`, change imports from:

```javascript
import {
  DEFAULT_BOARD_SIZE,
  GHOST_HINT_COUNT,
  MAX_GHOST_GENERATION_ATTEMPTS,
  GHOST_HINT_RADIUS,
  PHASES,
  HINT_TYPES,
  colorToSign,
  getQuadrant,
  getQuadrantVertices,
  randomInt
} from './constants'
```

To:

```javascript
import {
  DEFAULT_BOARD_SIZE,
  PHASES,
  HINT_TYPES,
  colorToSign,
  getQuadrantBounds,
  getSubQuadrant,
  isRegionSmallEnough
} from './constants'
```

**Step 2: Update constructor state**

Replace `this.currentGhostStones = []` with `this.currentHintRegion = null`

**Step 3: Update stats object**

Change stats from:

```javascript
this.stats = {
  wrongMoveCount: 0,
  correctFirstTry: 0,
  quadrantHintsUsed: 0,
  ghostHintsUsed: 0,
  triangleHintsUsed: 0,
  startTime: null,
  moveTimes: []
}
```

To:

```javascript
this.stats = {
  wrongMoveCount: 0,
  correctFirstTry: 0,
  quadrantHintsUsed: 0,
  subdivisionHintsUsed: 0,
  exactHintsUsed: 0,
  startTime: null,
  moveTimes: []
}
```

**Step 4: Update resetGame() method**

Change `this.currentGhostStones = []` to `this.currentHintRegion = null` and update stats reset to match new stats object.

**Step 5: Commit**

```bash
git add src/game/GameManager.js
git commit -m "refactor: update GameManager state for subdivision hints"
```

---

### Task 4: Implement New validateMove() Hint Logic

**Files:**
- Modify: `src/game/GameManager.js`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write failing test for first wrong attempt (quadrant hint)**

Add to `src/game/__tests__/GameManager.test.js`:

```javascript
describe('subdivision hints', () => {
  it('returns quadrant hint on first wrong attempt', () => {
    const moves = [{ x: 3, y: 3, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 0, maxX: 8, minY: 0, maxY: 8 })
  })

  it('returns subdivision hint on second wrong attempt', () => {
    const moves = [{ x: 2, y: 2, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 0, maxX: 4, minY: 0, maxY: 4 })
  })

  it('returns exact hint when region is small enough', () => {
    const moves = [{ x: 1, y: 1, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('exact')
    expect(result.position).toEqual({ x: 1, y: 1 })
  })

  it('resets hint region after correct move', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(3, 3)

    const result = gm.validateMove(0, 0)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 9, maxX: 18, minY: 9, maxY: 18 })
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL

**Step 3: Implement new validateMove() hint logic**

Replace the hint section in `validateMove()` (after `this.stats.wrongMoveCount++`) with:

```javascript
if (this.wrongAttemptsCurrentMove === 1) {
  this.stats.quadrantHintsUsed++
  this.currentHintRegion = getQuadrantBounds(correctMove, this.boardSize)
  return {
    correct: false,
    needHint: true,
    hintType: HINT_TYPES.QUADRANT,
    region: this.currentHintRegion
  }
}

if (isRegionSmallEnough(this.currentHintRegion)) {
  this.stats.exactHintsUsed++
  return {
    correct: false,
    needHint: true,
    hintType: HINT_TYPES.EXACT,
    position: { x: correctMove.x, y: correctMove.y }
  }
}

this.stats.subdivisionHintsUsed++
this.currentHintRegion = getSubQuadrant(this.currentHintRegion, correctMove)
return {
  correct: false,
  needHint: true,
  hintType: HINT_TYPES.QUADRANT,
  region: this.currentHintRegion
}
```

**Step 4: Add region reset on correct move**

In the `if (isCorrect)` block, add `this.currentHintRegion = null` after resetting `wrongAttemptsCurrentMove`.

**Step 5: Run tests to verify they pass**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 6: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: implement subdivision hint logic in validateMove"
```

---

### Task 5: Remove Ghost Stone Methods from GameManager

**Files:**
- Modify: `src/game/GameManager.js`

**Step 1: Remove generateGhostStones() method**

Delete the entire `generateGhostStones()` method (lines 156-193).

**Step 2: Remove isValidHintPosition() method**

Delete the entire `isValidHintPosition()` method (lines 195-209).

**Step 3: Remove handleGhostClick() method**

Delete the entire `handleGhostClick()` method (lines 302-333).

**Step 4: Remove getQuadrantHint() method**

Delete the `getQuadrantHint()` method (no longer needed, logic moved inline).

**Step 5: Run tests**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS (may need to remove tests that reference deleted methods)

**Step 6: Commit**

```bash
git add src/game/GameManager.js
git commit -m "refactor: remove ghost stone methods from GameManager"
```

---

### Task 6: Update ReplayPhase Component

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Remove eliminated letters state and HINT_LETTERS import**

Remove:
```javascript
import { HINT_LETTERS, BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
```

Change to:
```javascript
import { BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
```

Remove:
```javascript
const [eliminatedLetters, setEliminatedLetters] = useState([])
```

**Step 2: Remove ghost click handling from handleVertexClick**

Remove the entire `if (hintState?.hintType === 'ghost')` block (lines 24-38).

Remove `setEliminatedLetters([])` from line 31 and line 48.

**Step 3: Update hint rendering - replace ghost rendering with region-based**

Remove:
```javascript
if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
  hintState.ghostStones.forEach((ghost, index) => {
    const isEliminated = eliminatedLetters.some(g => g.x === ghost.x && g.y === ghost.y)
    if (!isEliminated) {
      markerMap[ghost.y][ghost.x] = { type: 'label', label: HINT_LETTERS[index] }
    }
  })
}
```

Update quadrant rendering to use region bounds:
```javascript
if (hintState?.hintType === 'quadrant' && hintState.region) {
  const { minX, maxX, minY, maxY } = hintState.region
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      paintMap[y][x] = 1
    }
  }
}
```

**Step 4: Update exact hint rendering**

Change:
```javascript
if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
  const { x, y } = hintState.correctPosition
  markerMap[y][x] = { type: 'point' }
}
```

To:
```javascript
if (hintState?.hintType === 'exact' && hintState.position) {
  const { x, y } = hintState.position
  markerMap[y][x] = { type: 'triangle' }
}
```

**Step 5: Run dev server and test manually**

Run: `npm run dev`
Test: Load a game, enter replay, make wrong moves, verify hints subdivide correctly.

**Step 6: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: update ReplayPhase for subdivision hints"
```

---

### Task 7: Clean Up Old Tests

**Files:**
- Modify: `src/game/__tests__/GameManager.test.js`

**Step 1: Remove or update tests referencing old hint system**

Search for and remove/update tests that reference:
- `ghostStones`
- `handleGhostClick`
- `HINT_TYPES.GHOST`
- `HINT_TYPES.TRIANGLE`
- `ghostHintsUsed`
- `triangleHintsUsed`

**Step 2: Run all tests**

Run: `npm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add src/game/__tests__/GameManager.test.js
git commit -m "test: clean up old ghost hint tests"
```

---

### Task 8: Final Verification

**Step 1: Run full test suite**

Run: `npm test -- --run`
Expected: All tests PASS

**Step 2: Run build**

Run: `npm run build`
Expected: Build succeeds with no errors

**Step 3: Manual testing**

Run: `npm run dev`

Test scenarios:
1. Make wrong move → quadrant highlights
2. Make another wrong move → smaller region highlights
3. Keep making wrong moves → region gets smaller
4. Eventually → exact point shown with triangle
5. Get correct move → hints reset for next move

**Step 4: Final commit (if any fixes needed)**

```bash
git add -A
git commit -m "fix: address issues found in final verification"
```
