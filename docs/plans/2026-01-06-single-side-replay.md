# Single-Side Replay Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users replay as one color while the system auto-plays opponent moves with randomized delay.

**Architecture:** Add `replaySide` state to GameManager. Controller handles auto-play timing via setTimeout. Stats track only user moves.

**Tech Stack:** React, Vitest, CSS Modules

---

## Task 1: Add Constants

**Files:**
- Modify: `src/game/constants.js:16-26`

**Step 1: Add REPLAY_SIDES constant**

Add after PHASES constant:

```javascript
export const REPLAY_SIDES = {
  BOTH: null,
  BLACK: 'B',
  WHITE: 'W'
}
```

**Step 2: Verify no syntax errors**

Run: `npm test -- --run`
Expected: All existing tests pass

**Step 3: Commit**

```bash
git add src/game/constants.js
git commit -m "feat: add REPLAY_SIDES constant"
```

---

## Task 2: Add GameManager State and isUserMove Helper

**Files:**
- Modify: `src/game/gameManager.js:5-31`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write failing tests for isUserMove**

Add to GameManager.test.js:

```javascript
describe('Single-Side Replay', () => {
  const mockMoves = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 15, color: 'W' },
    { x: 3, y: 15, color: 'B' },
    { x: 15, y: 3, color: 'W' }
  ]

  describe('isUserMove', () => {
    it('returns true for all moves when replaySide is null', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay()

      expect(gm.isUserMove(0)).toBe(true)
      expect(gm.isUserMove(1)).toBe(true)
      expect(gm.isUserMove(2)).toBe(true)
    })

    it('returns true only for black moves when replaySide is B', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      expect(gm.isUserMove(0)).toBe(true)
      expect(gm.isUserMove(1)).toBe(false)
      expect(gm.isUserMove(2)).toBe(true)
      expect(gm.isUserMove(3)).toBe(false)
    })

    it('returns true only for white moves when replaySide is W', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'W')

      expect(gm.isUserMove(0)).toBe(false)
      expect(gm.isUserMove(1)).toBe(true)
      expect(gm.isUserMove(2)).toBe(false)
      expect(gm.isUserMove(3)).toBe(true)
    })
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL - `gm.isUserMove is not a function`

**Step 3: Add replaySide state and isUserMove method**

In constructor, add after `this.replayEndMove`:

```javascript
this.replaySide = null
```

Modify `startReplay` signature and add replaySide assignment:

```javascript
startReplay(startMove = 0, endMove = this.moves.length - 1, side = null) {
  this.phase = PHASES.REPLAY
  this.replayStartMove = startMove
  this.replayEndMove = endMove
  this.replaySide = side
  // ... rest unchanged
```

Add method after `resetGame`:

```javascript
isUserMove(position) {
  if (this.replaySide === null) return true
  const move = this.moves[position]
  if (!move) return false
  return move.color === this.replaySide
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add replaySide state and isUserMove method"
```

---

## Task 3: Add playOpponentMove Method

**Files:**
- Modify: `src/game/gameManager.js`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write failing tests for playOpponentMove**

Add to Single-Side Replay describe block:

```javascript
describe('playOpponentMove', () => {
  it('plays the current move and advances position', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'W')

    const result = gm.playOpponentMove()

    expect(result.success).toBe(true)
    expect(result.move).toEqual({ x: 3, y: 3, color: 'B' })
    expect(gm.replayPosition).toBe(1)
    expect(gm.getCurrentBoard().get([3, 3])).toBe(1)
  })

  it('does not update stats', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'W')

    gm.playOpponentMove()

    expect(gm.stats.correctFirstTry).toBe(0)
    expect(gm.stats.wrongMoveCount).toBe(0)
  })

  it('returns error if called on user move', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'B')

    const result = gm.playOpponentMove()

    expect(result.error).toBe('Current move is not opponent move')
  })

  it('handles consecutive opponent moves', () => {
    const moves = [
      { x: 3, y: 3, color: 'W' },
      { x: 15, y: 15, color: 'W' },
      { x: 10, y: 10, color: 'B' }
    ]
    const gm = new GameManager(moves)
    gm.startReplay(0, 2, 'B')

    gm.playOpponentMove()
    const result = gm.playOpponentMove()

    expect(result.success).toBe(true)
    expect(gm.replayPosition).toBe(2)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL - `gm.playOpponentMove is not a function`

**Step 3: Implement playOpponentMove**

Add after `isUserMove`:

```javascript
playOpponentMove() {
  if (this.phase !== PHASES.REPLAY) {
    return { error: 'Not in replay phase' }
  }

  if (this.replayPosition > this.replayEndMove) {
    return { error: 'All moves completed' }
  }

  if (this.isUserMove(this.replayPosition)) {
    return { error: 'Current move is not opponent move' }
  }

  const move = this.moves[this.replayPosition]
  const sign = colorToSign(move.color)
  const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])
  this.boardHistory.push(newBoard)
  this.studyPosition++
  this.replayPosition++

  if (this.replayPosition > this.replayEndMove) {
    this.phase = PHASES.COMPLETE
    return { success: true, move, gameComplete: true }
  }

  return { success: true, move }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add playOpponentMove method"
```

---

## Task 4: Modify Stats to Track Only User Moves

**Files:**
- Modify: `src/game/gameManager.js:58-74` (getCompletionStats)
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write failing tests for user-only stats**

Add to Single-Side Replay describe block:

```javascript
describe('stats tracking', () => {
  it('counts only user moves for correctFirstTry', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'B')

    gm.validateMove(3, 3)
    gm.playOpponentMove()
    gm.validateMove(3, 15)
    gm.playOpponentMove()

    expect(gm.stats.correctFirstTry).toBe(2)
  })

  it('getCompletionStats returns only user move count', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'B')

    gm.validateMove(3, 3)
    gm.playOpponentMove()
    gm.validateMove(3, 15)
    gm.playOpponentMove()

    const stats = gm.getCompletionStats()
    expect(stats.totalMoves).toBe(2)
  })

  it('calculates accuracy from user moves only', () => {
    const gm = new GameManager(mockMoves)
    gm.startReplay(0, 3, 'B')

    gm.validateMove(3, 3)
    gm.playOpponentMove()
    gm.validateMove(0, 0)
    gm.validateMove(3, 15)
    gm.playOpponentMove()

    const stats = gm.getCompletionStats()
    expect(stats.accuracy).toBe(50)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL - totalMoves is 4, not 2

**Step 3: Modify getCompletionStats**

Replace getCompletionStats:

```javascript
getCompletionStats() {
  const totalTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0

  let userMoveCount
  if (this.replaySide === null) {
    userMoveCount = this.replayEndMove - this.replayStartMove + 1
  } else {
    userMoveCount = this.moves
      .slice(this.replayStartMove, this.replayEndMove + 1)
      .filter((m) => m.color === this.replaySide).length
  }

  const avgTime = userMoveCount > 0 ? totalTime / userMoveCount : 0

  return {
    totalMoves: userMoveCount,
    totalTimeMs: totalTime,
    totalTimeFormatted: (totalTime / 1000).toFixed(1),
    avgTimeMs: avgTime,
    avgTimeFormatted: (avgTime / 1000).toFixed(2),
    wrongMoveCount: this.stats.wrongMoveCount,
    correctFirstTry: this.stats.correctFirstTry,
    accuracy:
      userMoveCount > 0 ? Math.round((this.stats.correctFirstTry / userMoveCount) * 100) : 0
  }
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: stats track only user moves in single-side mode"
```

---

## Task 5: Add getReplaySide Getter to GameManager

**Files:**
- Modify: `src/game/gameManager.js`

**Step 1: Add getter after getState**

```javascript
getReplaySide() {
  return this.replaySide
}
```

**Step 2: Run tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 3: Commit**

```bash
git add src/game/gameManager.js
git commit -m "feat: add getReplaySide getter"
```

---

## Task 6: Update useGameController

**Files:**
- Modify: `src/game/useGameController.js`

**Step 1: Add startReplay with side parameter**

Change startReplay wrapper:

```javascript
startReplay(startMove, endMove, side = null) {
  const result = manager.startReplay(startMove, endMove, side)
  forceUpdate()
  return result
},
```

**Step 2: Add playOpponentMove wrapper**

Add after validateMove:

```javascript
playOpponentMove() {
  const result = manager.playOpponentMove()
  forceUpdate()
  if (result.success) onStonePlace?.()
  return result
},
```

**Step 3: Add isUserMove and getReplaySide wrappers**

Add after isValidPosition:

```javascript
isUserMove(position) {
  return manager.isUserMove(position)
},

getReplaySide() {
  return manager.getReplaySide()
}
```

**Step 4: Run tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 5: Commit**

```bash
git add src/game/useGameController.js
git commit -m "feat: expose single-side replay methods in controller"
```

---

## Task 7: Add Button Styles

**Files:**
- Modify: `src/styles/Buttons.module.css`

**Step 1: Add black and white button styles**

Add at end of file:

```css
.replayButtonGroup {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.replayAsBlack {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #1a1a1a;
  color: #ffffff;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.replayAsBlack:hover {
  background-color: #333333;
}

.replayAsWhite {
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #f5f5f5;
  color: #1a1a1a;
  border: 2px solid #1a1a1a;
  border-radius: 5px;
  cursor: pointer;
}

.replayAsWhite:hover {
  background-color: #e0e0e0;
}
```

**Step 2: Commit**

```bash
git add src/styles/Buttons.module.css
git commit -m "feat: add black and white replay button styles"
```

---

## Task 8: Update RightPanel with New Buttons

**Files:**
- Modify: `src/components/RightPanel.jsx`

**Step 1: Add gameInfo and callbacks to props**

Update component signature:

```javascript
export default function RightPanel({
  phase,
  current,
  total,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  totalMoves,
  onRangeChange,
  onStartReplay,
  onStartReplayAs,
  gameInfo,
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex,
  onRestart,
  onGoHome
}) {
```

**Step 2: Replace single replay button with button group**

Replace the study phase replay section (lines 43-54):

```javascript
{phase === 'study' && (
  <>
    <div className={[styles.section, buttons.controls].join(' ')}>
      <button className={buttons.buttonFlex} onClick={onPrev} disabled={!canGoPrev}>
        Prev
      </button>
      <button className={buttons.buttonFlex} onClick={onNext} disabled={!canGoNext}>
        Next
      </button>
    </div>
    <div className={styles.section}>
      <RangeSlider
        min={0}
        max={totalMoves - 1}
        start={rangeStart}
        end={rangeEnd}
        onChange={onRangeChange}
      />
      <div className={buttons.replayButtonGroup}>
        <button className={buttons.primaryButton} onClick={onStartReplay}>
          Replay All
        </button>
        <button
          className={buttons.replayAsBlack}
          onClick={() => onStartReplayAs('B')}
        >
          Replay as {gameInfo?.blackPlayer || 'Black'}
        </button>
        <button
          className={buttons.replayAsWhite}
          onClick={() => onStartReplayAs('W')}
        >
          Replay as {gameInfo?.whitePlayer || 'White'}
        </button>
      </div>
    </div>
  </>
)}
```

**Step 3: Run dev server and visually verify**

Run: `npm run dev`
Expected: Three replay buttons appear in study phase

**Step 4: Commit**

```bash
git add src/components/RightPanel.jsx
git commit -m "feat: add single-side replay buttons to RightPanel"
```

---

## Task 9: Update CollapsibleHeader with New Buttons

**Files:**
- Modify: `src/components/CollapsibleHeader.jsx`

**Step 1: Add onStartReplayAs and gameInfo props**

Props already has gameInfo. Add onStartReplayAs:

```javascript
export default function CollapsibleHeader({
  gameInfo,
  phase,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  onStartReplayAs,
  stats,
  currentTurn
}) {
```

**Step 2: Replace single button with button group**

Replace study phase section (lines 41-59):

```javascript
{phase === 'study' && (
  <div className={styles.section}>
    <RangeSlider
      min={0}
      max={totalMoves - 1}
      start={rangeStart}
      end={rangeEnd}
      onChange={onRangeChange}
    />
    <div className={buttons.replayButtonGroup}>
      <button
        className={buttons.primaryButton}
        onClick={() => {
          onStartReplay()
          setIsExpanded(false)
        }}
      >
        Replay All
      </button>
      <button
        className={buttons.replayAsBlack}
        onClick={() => {
          onStartReplayAs('B')
          setIsExpanded(false)
        }}
      >
        Replay as {gameInfo?.blackPlayer || 'Black'}
      </button>
      <button
        className={buttons.replayAsWhite}
        onClick={() => {
          onStartReplayAs('W')
          setIsExpanded(false)
        }}
      >
        Replay as {gameInfo?.whitePlayer || 'White'}
      </button>
    </div>
  </div>
)}
```

**Step 3: Commit**

```bash
git add src/components/CollapsibleHeader.jsx
git commit -m "feat: add single-side replay buttons to CollapsibleHeader"
```

---

## Task 10: Update StudyPhase to Pass New Props

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Add handleStartReplayAs function**

After handleStartReplay:

```javascript
const handleStartReplayAs = (side) => {
  gameManager.startReplay(rangeStart, rangeEnd, side)
}
```

**Step 2: Pass new props to RightPanel**

Add to RightPanel props:

```javascript
<RightPanel
  phase="study"
  current={state.studyPosition}
  total={state.totalMoves}
  canGoPrev={canGoPrev}
  canGoNext={canGoNext}
  onPrev={() => gameManager.studyPrev()}
  onNext={() => gameManager.studyNext()}
  rangeStart={rangeStart}
  rangeEnd={rangeEnd}
  totalMoves={state.totalMoves}
  onRangeChange={handleRangeChange}
  onStartReplay={handleStartReplay}
  onStartReplayAs={handleStartReplayAs}
  gameInfo={gameInfo}
/>
```

**Step 3: Pass new props to CollapsibleHeader**

Add onStartReplayAs:

```javascript
<CollapsibleHeader
  gameInfo={gameInfo}
  phase="study"
  totalMoves={state.totalMoves}
  rangeStart={rangeStart}
  rangeEnd={rangeEnd}
  onRangeChange={handleRangeChange}
  onStartReplay={handleStartReplay}
  onStartReplayAs={handleStartReplayAs}
  currentTurn={currentTurn}
/>
```

**Step 4: Run dev server and test buttons**

Run: `npm run dev`
Expected: Clicking "Replay as Black/White" starts replay in single-side mode

**Step 5: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: wire up single-side replay buttons in StudyPhase"
```

---

## Task 11: Add Auto-Play Logic to ReplayPhase

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Import useEffect and useCallback**

Already imported. Add useRef:

```javascript
import React, { useState, useEffect, useCallback, useRef } from 'react'
```

**Step 2: Add auto-play effect**

After state declarations, add:

```javascript
const autoPlayTimeoutRef = useRef(null)

const scheduleOpponentMove = useCallback(() => {
  if (autoPlayTimeoutRef.current) {
    clearTimeout(autoPlayTimeoutRef.current)
  }

  const delay = 500 + Math.random() * 500
  autoPlayTimeoutRef.current = setTimeout(() => {
    const result = gameManager.playOpponentMove()
    if (result.success && !result.gameComplete) {
      if (!gameManager.isUserMove(gameManager.replayPosition)) {
        scheduleOpponentMove()
      }
    }
  }, delay)
}, [gameManager])

useEffect(() => {
  const replaySide = gameManager.getReplaySide()
  if (replaySide === null || isComplete) return

  if (!gameManager.isUserMove(gameManager.replayPosition)) {
    scheduleOpponentMove()
  }

  return () => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }
  }
}, [gameManager, gameManager.replayPosition, isComplete, scheduleOpponentMove])
```

**Step 3: Trigger auto-play after user move**

Modify commitMove to schedule opponent move after success:

```javascript
const commitMove = (x, y) => {
  const result = gameManager.validateMove(x, y)

  if (result.correct) {
    setHintState(null)
    setPendingMove(null)
    setBorderFlash('success')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

    if (result.gameComplete) {
      setBottomPanelExpanded(true)
    } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
      scheduleOpponentMove()
    }
  } else if (result.needHint) {
    setHintState(result)
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  }
}
```

**Step 4: Run dev server and test full flow**

Run: `npm run dev`
Expected:
1. Select "Replay as White"
2. Black's first move auto-plays after ~0.5-1s delay
3. After user plays White move, Black auto-plays again

**Step 5: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: add auto-play logic for opponent moves"
```

---

## Task 12: Run Full Test Suite and Manual Test

**Step 1: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Manual test checklist**

1. Upload any SGF file
2. Study phase: verify three replay buttons appear
3. Click "Replay as Black":
   - First move waits for user input
   - After correct Black move, White auto-plays with delay
   - Stats show only Black moves
4. Click "Replay as White":
   - Black's first move auto-plays immediately
   - After auto-play, user inputs White move
   - Stats show only White moves
5. "Replay All" works as before
6. Test on mobile layout (resize browser)

**Step 3: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete single-side replay mode"
```
