# Handicap Stones Support - Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Support handicap games by pre-placing setup stones and displaying handicap/komi in game info.

**Architecture:** Parse `AB`/`AW` properties from SGF root node as setup stones, pass to GameManager to pre-populate initial board state. Setup stones are not part of the move list and don't affect stats.

**Tech Stack:** @sabaki/sgf for parsing, @sabaki/go-board for board state, Vitest for testing.

---

### Task 1: Add getSetupStones parser function

**Files:**
- Modify: `src/lib/sgfParser.js:50-60` (after parseSGFCoordinate)
- Test: `src/lib/__tests__/sgfParser.test.js`

**Step 1: Write the failing tests**

Add to `src/lib/__tests__/sgfParser.test.js`:

```javascript
import { parseSGFToMoves, getBoardSize, getGameInfo, getSetupStones } from '../sgfParser.js'

// Add new describe block after getGameInfo tests
describe('getSetupStones', () => {
  it('returns empty array for game without setup stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[dd])'
    const stones = getSetupStones(sgf)
    expect(stones).toEqual([])
  })

  it('parses AB (Add Black) stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AB[dd][pd][dp][pp];W[qf])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(4)
    expect(stones).toContainEqual({ x: 3, y: 3, color: 'B' })
    expect(stones).toContainEqual({ x: 15, y: 3, color: 'B' })
    expect(stones).toContainEqual({ x: 3, y: 15, color: 'B' })
    expect(stones).toContainEqual({ x: 15, y: 15, color: 'B' })
  })

  it('parses AW (Add White) stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AW[dd][pd];B[dp])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(2)
    expect(stones).toContainEqual({ x: 3, y: 3, color: 'W' })
    expect(stones).toContainEqual({ x: 15, y: 3, color: 'W' })
  })

  it('parses both AB and AW stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AB[dd][pd]AW[dp][pp];B[qf])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(4)
    expect(stones.filter(s => s.color === 'B')).toHaveLength(2)
    expect(stones.filter(s => s.color === 'W')).toHaveLength(2)
  })

  it('parses 9-stone handicap correctly', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9]AB[jd][jp][dj][pj][jj][dd][pp][pd][dp];W[qq])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(9)
    expect(stones.every(s => s.color === 'B')).toBe(true)
  })

  it('returns empty array for invalid SGF', () => {
    const stones = getSetupStones('invalid')
    expect(stones).toEqual([])
  })

  it('returns empty array for empty string', () => {
    const stones = getSetupStones('')
    expect(stones).toEqual([])
  })
})
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: FAIL with "getSetupStones is not exported"

**Step 3: Write minimal implementation**

Add to `src/lib/sgfParser.js` after `parseSGFCoordinate` function (around line 60):

```javascript
export function getSetupStones(sgfContent) {
  try {
    const gameTree = parse(sgfContent)

    if (!gameTree || gameTree.length === 0) {
      return []
    }

    const rootNode = gameTree[0]
    const stones = []

    if (rootNode.data.AB) {
      rootNode.data.AB.forEach((coord) => {
        const [x, y] = parseSGFCoordinate(coord)
        if (x !== null && y !== null) {
          stones.push({ x, y, color: 'B' })
        }
      })
    }

    if (rootNode.data.AW) {
      rootNode.data.AW.forEach((coord) => {
        const [x, y] = parseSGFCoordinate(coord)
        if (x !== null && y !== null) {
          stones.push({ x, y, color: 'W' })
        }
      })
    }

    return stones
  } catch (_error) {
    return []
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: PASS (all tests including new ones)

**Step 5: Commit**

```bash
git add src/lib/sgfParser.js src/lib/__tests__/sgfParser.test.js
git commit -m "feat(parser): add getSetupStones for handicap stone parsing"
```

---

### Task 2: Add handicap and komi to getGameInfo

**Files:**
- Modify: `src/lib/sgfParser.js:85-95` (getGameInfo return object)
- Test: `src/lib/__tests__/sgfParser.test.js`

**Step 1: Write the failing tests**

Add to `describe('getGameInfo')` in `src/lib/__tests__/sgfParser.test.js`:

```javascript
  it('extracts handicap from HA property', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9])'
    const info = getGameInfo(sgf)
    expect(info.handicap).toBe(9)
  })

  it('returns null handicap when not present', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const info = getGameInfo(sgf)
    expect(info.handicap).toBeNull()
  })

  it('extracts komi from KM property', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[6.5])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBe(6.5)
  })

  it('extracts zero komi for handicap games', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9]KM[0.5])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBe(0.5)
  })

  it('returns null komi when not present', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBeNull()
  })
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: FAIL with "expect(received).toBe(expected)" for handicap/komi

**Step 3: Write minimal implementation**

Modify `getGameInfo` in `src/lib/sgfParser.js` to add handicap and komi to return object:

```javascript
export function getGameInfo(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]
    const data = rootNode.data

    const sourceUrl = extractSourceUrl(data.PC?.[0]) || extractSourceUrl(data.SO?.[0]) || null

    return {
      blackPlayer: data.PB?.[0] || null,
      whitePlayer: data.PW?.[0] || null,
      blackRank: data.BR?.[0] || null,
      whiteRank: data.WR?.[0] || null,
      date: data.DT?.[0] || null,
      gameName: data.GN?.[0] || null,
      result: data.RE?.[0] || null,
      rules: data.RU?.[0] || null,
      handicap: data.HA?.[0] ? parseInt(data.HA[0]) : null,
      komi: data.KM?.[0] ? parseFloat(data.KM[0]) : null,
      sourceUrl
    }
  } catch (_error) {
    return {}
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/sgfParser.js src/lib/__tests__/sgfParser.test.js
git commit -m "feat(parser): add handicap and komi to getGameInfo"
```

---

### Task 3: Update GameManager constructor to accept setupStones

**Files:**
- Modify: `src/game/gameManager.js:6-15` (constructor)
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the failing tests**

Add to `describe('constructor')` in `src/game/__tests__/GameManager.test.js`:

```javascript
    it('accepts setupStones and pre-populates initial board', () => {
      const setupStones = [
        { x: 3, y: 3, color: 'B' },
        { x: 15, y: 3, color: 'B' },
        { x: 3, y: 15, color: 'B' },
        { x: 15, y: 15, color: 'B' }
      ]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.get([3, 3])).toBe(1)
      expect(initialBoard.get([15, 3])).toBe(1)
      expect(initialBoard.get([3, 15])).toBe(1)
      expect(initialBoard.get([15, 15])).toBe(1)
    })

    it('initial board is not empty when setupStones provided', () => {
      const setupStones = [{ x: 9, y: 9, color: 'B' }]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.isEmpty()).toBe(false)
    })

    it('works with empty setupStones array', () => {
      const manager = new GameManager(mockMoves, 19, [])
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.isEmpty()).toBe(true)
    })

    it('handles white setup stones', () => {
      const setupStones = [{ x: 3, y: 3, color: 'W' }]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.get([3, 3])).toBe(-1)
    })
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL (setupStones parameter ignored, board is empty)

**Step 3: Write minimal implementation**

Modify constructor in `src/game/gameManager.js`:

```javascript
export default class GameManager {
  constructor(moves, boardSize = DEFAULT_BOARD_SIZE, setupStones = []) {
    if (!Array.isArray(moves)) {
      throw new Error('moves must be an array')
    }
    this.moves = [...moves]
    this.boardSize = boardSize
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0

    let initialBoard = Board.fromDimensions(boardSize, boardSize)
    for (const stone of setupStones) {
      const sign = colorToSign(stone.color)
      initialBoard = initialBoard.set(stone.x, stone.y, sign)
    }
    this.boardHistory = [initialBoard]

    this.wrongAttemptsCurrentMove = 0
    this.currentHintRegion = null
    this.replayStartMove = 0
    this.replayEndMove = this.moves.length - 1
    this.replaySide = null
    this.wrongAttemptsByMove = []

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      subdivisionHintsUsed: 0,
      exactHintsUsed: 0,
      startTime: null,
      endTime: null,
      moveTimes: []
    }
  }
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat(gameManager): accept setupStones to pre-populate board"
```

---

### Task 4: Add stats integrity tests for handicap games

**Files:**
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the tests**

Add new describe block to `src/game/__tests__/GameManager.test.js`:

```javascript
  describe('Handicap Game Stats Integrity', () => {
    const handicapSetupStones = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 3, color: 'B' },
      { x: 3, y: 15, color: 'B' },
      { x: 15, y: 15, color: 'B' }
    ]

    const handicapMoves = [
      { x: 16, y: 2, color: 'W' },
      { x: 2, y: 16, color: 'B' },
      { x: 16, y: 16, color: 'W' }
    ]

    it('totalMoves reflects game moves, not setup stones', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
      const state = manager.getState()

      expect(state.totalMoves).toBe(3)
    })

    it('setup stones do not affect move count in completion stats', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
      manager.startReplay(0, 2)

      manager.validateMove(16, 2)
      manager.validateMove(2, 16)
      manager.validateMove(16, 16)

      const stats = manager.getCompletionStats()
      expect(stats.totalMoves).toBe(3)
    })

    it('accuracy calculation is based on game moves only', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
      manager.startReplay(0, 2)

      manager.validateMove(16, 2)
      manager.validateMove(2, 16)
      manager.validateMove(16, 16)

      const stats = manager.getCompletionStats()
      expect(stats.accuracy).toBe(100)
      expect(stats.correctFirstTry).toBe(3)
    })

    it('study navigation works correctly with setup stones', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)

      expect(manager.studyPosition).toBe(0)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)

      manager.studyNext()
      expect(manager.studyPosition).toBe(1)
      expect(manager.getCurrentBoard().get([16, 2])).toBe(-1)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
    })

    it('range selection indexes into game moves, not setup stones', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
      manager.startReplay(1, 2)

      expect(manager.replayStartMove).toBe(1)
      expect(manager.replayEndMove).toBe(2)

      const firstMoveToReplay = manager.moves[manager.replayPosition]
      expect(firstMoveToReplay.color).toBe('B')
      expect(firstMoveToReplay.x).toBe(2)
    })

    it('wrong move count only tracks game moves', () => {
      const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
      manager.startReplay(0, 2)

      manager.validateMove(0, 0)
      manager.validateMove(16, 2)
      manager.validateMove(2, 16)
      manager.validateMove(16, 16)

      const stats = manager.getCompletionStats()
      expect(stats.wrongMoveCount).toBe(1)
      expect(stats.correctFirstTry).toBe(2)
    })
  })
```

**Step 2: Run tests to verify they pass**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS (these tests verify existing behavior works correctly with setupStones)

**Step 3: Commit**

```bash
git add src/game/__tests__/GameManager.test.js
git commit -m "test(gameManager): add stats integrity tests for handicap games"
```

---

### Task 5: Update useGameController to pass setupStones

**Files:**
- Modify: `src/game/useGameController.js:4-6`

**Step 1: Modify useGameController**

Update `src/game/useGameController.js`:

```javascript
export default function useGameController(sgfMoves, boardSize, setupStones = [], { onStonePlace } = {}) {
  const [manager] = useState(() => new GameManager(sgfMoves, boardSize, setupStones))
  const [, forceUpdate] = useReducer((x) => x + 1, 0)
```

Note: The parameter order changes - `setupStones` comes before options object.

**Step 2: Run all tests to verify nothing breaks**

Run: `npm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add src/game/useGameController.js
git commit -m "feat(useGameController): accept setupStones parameter"
```

---

### Task 6: Wire setupStones through HomePage

**Files:**
- Modify: `src/pages/HomePage.jsx:2,12,48,63-91,121`

**Step 1: Update imports and state**

In `src/pages/HomePage.jsx`, update import:

```javascript
import { parseSGFToMoves, getBoardSize, getGameInfo, getSetupStones } from '../lib/sgfParser.js'
```

**Step 2: Add setupStones state in HomePage**

Add new state after line 66:

```javascript
const [setupStones, setSetupStones] = useState(null)
```

**Step 3: Parse setupStones in handleFileLoaded**

Update `handleFileLoaded` to parse and set setupStones:

```javascript
  const handleFileLoaded = (sgfContent, sourceUrl = null) => {
    try {
      const size = getBoardSize(sgfContent)
      const parsedMoves = parseSGFToMoves(sgfContent)

      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      const info = getGameInfo(sgfContent)
      if (sourceUrl && !info.sourceUrl) {
        info.sourceUrl = sourceUrl
      }

      const stones = getSetupStones(sgfContent)

      setMoves(parsedMoves)
      setBoardSize(size)
      setGameInfo(info)
      setSetupStones(stones)
      trackGameLoaded({
        source: sourceUrl ? 'ogs' : 'file',
        boardSize: size,
        moveCount: parsedMoves.length
      })
      setError(null)
    } catch (err) {
      setError(`Failed to load game: ${err.message}`)
    }
  }
```

**Step 4: Reset setupStones in handleGoHome**

Update `handleGoHome`:

```javascript
  const handleGoHome = (fromPhase = 'study') => {
    trackNewGameStarted({ fromPhase })
    setMoves(null)
    setBoardSize(null)
    setGameInfo(null)
    setSetupStones(null)
  }
```

**Step 5: Pass setupStones to GameWrapper**

Update the GameWrapper render:

```javascript
  return (
    <GameWrapper
      moves={moves}
      boardSize={boardSize}
      setupStones={setupStones}
      gameInfo={gameInfo}
      onGoHome={handleGoHome}
    />
  )
```

**Step 6: Update GameWrapper component**

Update GameWrapper to accept and pass setupStones:

```javascript
function GameWrapper({ moves, boardSize, setupStones, gameInfo, onGoHome }) {
  // ... audio refs code unchanged ...

  const gameManager = useGameController(moves, boardSize, setupStones, { onStonePlace: playStoneSound })
  // ... rest unchanged
}
```

**Step 7: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 8: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat(homePage): wire setupStones from parser to game controller"
```

---

### Task 7: Display handicap and komi in GameInfo

**Files:**
- Modify: `src/components/GameInfo.jsx:7-14,49-75`

**Step 1: Update hasInfo check**

Update the `hasInfo` check to include handicap and komi:

```javascript
  const hasInfo =
    gameInfo.blackPlayer ||
    gameInfo.whitePlayer ||
    gameInfo.gameName ||
    gameInfo.date ||
    gameInfo.result ||
    gameInfo.rules ||
    gameInfo.handicap ||
    gameInfo.komi !== null ||
    gameInfo.sourceUrl
```

**Step 2: Add handicap and komi display**

Add after the rules display (around line 67), before sourceUrl:

```javascript
        {gameInfo.handicap && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Handicap:</span>
            <span>{gameInfo.handicap} stones</span>
          </div>
        )}
        {gameInfo.komi !== null && (
          <div className={styles.detailRow}>
            <span className={styles.label}>Komi:</span>
            <span>{gameInfo.komi}</span>
          </div>
        )}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/GameInfo.jsx
git commit -m "feat(gameInfo): display handicap and komi"
```

---

### Task 8: Manual testing with handicap SGF

**Files:**
- Test file: `docs/handicapped.sgf`

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test with handicap file**

1. Open http://localhost:5173
2. Upload `docs/handicapped.sgf`
3. Verify:
   - 9 black stones appear on the board immediately
   - Game info shows "Handicap: 9 stones" and "Komi: 0.5"
   - First move indicator shows White to play
   - Navigate through moves - handicap stones persist
   - Start replay - handicap stones present, first move to replay is White
   - Complete replay - stats show correct move count (not inflated by handicap)

**Step 3: Test with non-handicap game**

1. Load a regular SGF file
2. Verify:
   - Board starts empty
   - No handicap/komi shown in game info (unless komi is in SGF)
   - Normal gameplay

**Step 4: Commit test file (if not already committed)**

```bash
git add docs/handicapped.sgf
git commit -m "test: add sample handicap SGF for manual testing"
```

---

### Task 9: Run full test suite and format

**Step 1: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Run linter**

Run: `npm run lint`
Expected: No errors

**Step 3: Run formatter**

Run: `npm run format`

**Step 4: Final commit if formatting changed files**

```bash
git add -A
git commit -m "chore: format code"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add getSetupStones parser | sgfParser.js, sgfParser.test.js |
| 2 | Add handicap/komi to getGameInfo | sgfParser.js, sgfParser.test.js |
| 3 | Update GameManager constructor | gameManager.js, GameManager.test.js |
| 4 | Add stats integrity tests | GameManager.test.js |
| 5 | Update useGameController | useGameController.js |
| 6 | Wire through HomePage | HomePage.jsx |
| 7 | Display in GameInfo | GameInfo.jsx |
| 8 | Manual testing | - |
| 9 | Final test suite & format | - |
