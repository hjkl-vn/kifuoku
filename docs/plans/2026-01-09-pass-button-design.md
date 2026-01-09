# Pass Button Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a pass button for the replay phase, allowing users to indicate when they remember a move was a pass.

**Architecture:** Modify SGF parser to include pass moves, add `validatePass()` to GameManager, update BottomBar to always show Pass/Confirm buttons, add Pass button to RightPanel during replay.

**Tech Stack:** React, Vitest, CSS Modules

---

## Task 1: Update SGF Parser to Include Pass Moves

**Files:**
- Modify: `src/lib/sgfParser.js:20-53`
- Test: `src/lib/__tests__/sgfParser.test.js`

**Step 1: Write the failing test**

Add to `src/lib/__tests__/sgfParser.test.js`:

```javascript
describe('pass moves', () => {
  it('parses pass move with empty coordinate', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[];B[dp])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(3)
    expect(result.moves[0]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 1, isPass: false })
    expect(result.moves[1]).toEqual({ color: 'W', moveNumber: 2, isPass: true })
    expect(result.moves[2]).toEqual({ x: 3, y: 15, color: 'B', moveNumber: 3, isPass: false })
  })

  it('parses pass move with tt coordinate', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[tt];B[dp])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(3)
    expect(result.moves[1]).toEqual({ color: 'W', moveNumber: 2, isPass: true })
  })

  it('parseSGFToMoves includes pass moves', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[];B[dp])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(3)
    expect(moves[1].isPass).toBe(true)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: FAIL - moves array only has 2 items (pass filtered out)

**Step 3: Implement pass move parsing**

Modify `extractMoves` in `src/lib/sgfParser.js`:

```javascript
function extractMoves(rootNode) {
  const moves = []
  let moveNumber = 0

  function traverseNode(node) {
    if (!node) return

    const blackMove = node.data.B
    const whiteMove = node.data.W

    if (blackMove !== undefined) {
      const [x, y] = parseSGFCoordinate(blackMove[0])
      moveNumber++
      if (x !== null && y !== null) {
        moves.push({ x, y, color: 'B', moveNumber, isPass: false })
      } else {
        moves.push({ color: 'B', moveNumber, isPass: true })
      }
    }

    if (whiteMove !== undefined) {
      const [x, y] = parseSGFCoordinate(whiteMove[0])
      moveNumber++
      if (x !== null && y !== null) {
        moves.push({ x, y, color: 'W', moveNumber, isPass: false })
      } else {
        moves.push({ color: 'W', moveNumber, isPass: true })
      }
    }

    if (node.children && node.children.length > 0) {
      traverseNode(node.children[0])
    }
  }

  traverseNode(rootNode)
  return moves
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/lib/__tests__/sgfParser.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/lib/sgfParser.js src/lib/__tests__/sgfParser.test.js
git commit -m "feat(sgfParser): include pass moves in parsed output"
```

---

## Task 2: Add validatePass to GameManager

**Files:**
- Modify: `src/game/gameManager.js`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the failing tests**

Add to `src/game/__tests__/GameManager.test.js`:

```javascript
describe('Pass Move Validation', () => {
  const movesWithPass = [
    { x: 3, y: 3, color: 'B', isPass: false },
    { color: 'W', isPass: true },
    { x: 15, y: 15, color: 'B', isPass: false }
  ]

  it('validatePass returns correct when expected move is pass', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validatePass()

    expect(result.correct).toBe(true)
    expect(gm.replayPosition).toBe(2)
  })

  it('validatePass returns wrong when expected move is stone placement', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()

    const result = gm.validatePass()

    expect(result.correct).toBe(false)
    expect(result.needHint).toBe(true)
    expect(gm.replayPosition).toBe(0)
  })

  it('validateMove on stone when expected is pass flashes error without quadrant hint', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.expectedPass).toBe(true)
    expect(result.hintType).toBeUndefined()
  })

  it('pass moves count toward stats', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validatePass()
    gm.validateMove(15, 15)

    expect(gm.stats.correctFirstTry).toBe(3)
  })

  it('wrong pass attempt increments wrongMoveCount', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()

    gm.validatePass()

    expect(gm.stats.wrongMoveCount).toBe(1)
  })

  it('pass moves are not added to difficult moves', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validateMove(10, 10)
    gm.validatePass()
    gm.validateMove(15, 15)

    const difficult = gm.getDifficultMoves()
    expect(difficult).toHaveLength(0)
  })

  it('playOpponentMove handles opponent pass', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay(0, 2, 'B')
    gm.validateMove(3, 3)

    const result = gm.playOpponentMove()

    expect(result.success).toBe(true)
    expect(result.move.isPass).toBe(true)
    expect(gm.replayPosition).toBe(2)
  })

  it('game completes when final move is pass', () => {
    const movesEndingInPass = [
      { x: 3, y: 3, color: 'B', isPass: false },
      { color: 'W', isPass: true }
    ]
    const gm = new GameManager(movesEndingInPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validatePass()

    expect(result.correct).toBe(true)
    expect(result.gameComplete).toBe(true)
    expect(gm.phase).toBe('complete')
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL - validatePass is not a function

**Step 3: Implement validatePass in GameManager**

Add to `src/game/gameManager.js` after `validateMove`:

```javascript
validatePass() {
  if (this.phase !== PHASES.REPLAY) {
    return { error: 'Not in replay phase' }
  }

  if (this.replayPosition > this.replayEndMove) {
    return { error: 'All moves completed' }
  }

  const correctMove = this.moves[this.replayPosition]
  const isCorrect = correctMove.isPass === true

  if (isCorrect) {
    if (this.wrongAttemptsCurrentMove === 0) {
      this.stats.correctFirstTry++
    }

    const moveTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
    this.stats.moveTimes.push(moveTime)

    this.replayPosition++
    this.studyPosition++
    this.wrongAttemptsCurrentMove = 0
    this.currentHintRegion = null

    if (this.replayPosition > this.replayEndMove) {
      this.phase = PHASES.COMPLETE
      this.stats.endTime = Date.now()
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
}
```

**Step 4: Modify validateMove to handle pass expected case**

Update `validateMove` in `src/game/gameManager.js` - add check at the start:

```javascript
validateMove(x, y) {
  if (this.phase !== PHASES.REPLAY) {
    return { error: 'Not in replay phase' }
  }

  if (this.replayPosition >= this.moves.length) {
    return { error: 'All moves completed' }
  }

  const correctMove = this.moves[this.replayPosition]

  if (correctMove.isPass) {
    this.wrongAttemptsCurrentMove++
    this.stats.wrongMoveCount++
    return {
      correct: false,
      expectedPass: true
    }
  }

  const isCorrect = correctMove.x === x && correctMove.y === y
  // ... rest of existing code
```

**Step 5: Modify playOpponentMove to handle pass**

Update `playOpponentMove` in `src/game/gameManager.js`:

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

  if (!move.isPass) {
    const sign = colorToSign(move.color)
    const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])
    this.boardHistory.push(newBoard)
    this.studyPosition++
  }

  this.replayPosition++

  if (this.replayPosition > this.replayEndMove) {
    this.phase = PHASES.COMPLETE
    this.stats.endTime = Date.now()
    return { success: true, move, gameComplete: true }
  }

  return { success: true, move }
}
```

**Step 6: Run tests to verify they pass**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 7: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat(gameManager): add validatePass for pass move support"
```

---

## Task 3: Expose validatePass in useGameController

**Files:**
- Modify: `src/game/useGameController.js`

**Step 1: Add validatePass wrapper**

Add to the `wrappedManager` object in `src/game/useGameController.js`:

```javascript
validatePass() {
  const result = manager.validatePass()
  forceUpdate()
  return result
},
```

**Step 2: Run existing tests to verify no regression**

Run: `npm test -- --run`
Expected: PASS

**Step 3: Commit**

```bash
git add src/game/useGameController.js
git commit -m "feat(useGameController): expose validatePass method"
```

---

## Task 4: Update BottomBar Component

**Files:**
- Modify: `src/components/BottomBar.jsx`
- Modify: `src/styles/BottomBar.module.css`

**Step 1: Update BottomBar props and layout**

Replace `src/components/BottomBar.jsx`:

```jsx
import React from 'react'
import { ANNOTATION_TOOLS } from '../game/constants'
import ProgressBar from './ProgressBar'
import styles from '../styles/BottomBar.module.css'

export default function BottomBar({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  current,
  total,
  replaySide,
  selectedTool,
  onSelectTool,
  pendingMove,
  onConfirm,
  onPass,
  isUserTurn
}) {
  const hasNavButtons = onPrev && onNext
  const hasAnnotationTools = onSelectTool !== undefined
  const hasReplayControls = onPass !== undefined

  return (
    <div className={styles.container}>
      <div className={styles.progressWrapper}>
        <ProgressBar current={current} total={total} replaySide={replaySide} />
      </div>
      <div className={styles.controls}>
        {hasAnnotationTools && !hasReplayControls && (
          <div className={styles.tools}>
            {ANNOTATION_TOOLS.map((tool) => (
              <button
                key={tool.id}
                className={[styles.toolButton, selectedTool === tool.id ? styles.toolSelected : '']
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
                title={tool.title}
                aria-pressed={selectedTool === tool.id}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
        {hasReplayControls ? (
          <div className={styles.buttons}>
            <button
              type="button"
              className={styles.passButton}
              onClick={onPass}
              disabled={!isUserTurn}
            >
              Pass
            </button>
            <button
              type="button"
              className={styles.confirmButton}
              onClick={onConfirm}
              disabled={!pendingMove}
            >
              Confirm
            </button>
          </div>
        ) : (
          hasNavButtons && (
            <div className={styles.buttons}>
              <button className={styles.button} onClick={onPrev} disabled={!canGoPrev}>
                ◀ Prev
              </button>
              <button className={styles.button} onClick={onNext} disabled={!canGoNext}>
                Next ▶
              </button>
            </div>
          )
        )}
      </div>
    </div>
  )
}
```

**Step 2: Add passButton style to CSS**

Add to `src/styles/BottomBar.module.css`:

```css
.passButton {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #9e9e9e;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.passButton:hover:not(:disabled) {
  background-color: #8e8e8e;
}

.passButton:active:not(:disabled) {
  background-color: #757575;
}

.passButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.confirmButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/BottomBar.jsx src/styles/BottomBar.module.css
git commit -m "feat(BottomBar): replace cancel with pass, always visible"
```

---

## Task 5: Add Pass Button to RightPanel

**Files:**
- Modify: `src/components/RightPanel.jsx`
- Modify: `src/styles/RightPanel.module.css`

**Step 1: Add pass button to replay phase section**

Update `src/components/RightPanel.jsx` - add `onPass` and `isUserTurn` props and render pass button in replay phase:

```jsx
import React from 'react'
import ProgressBar from './ProgressBar'
import RangeSlider from './RangeSlider'
import styles from '../styles/RightPanel.module.css'
import buttons from '../styles/Buttons.module.css'

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
  gameInfo,
  replaySide,
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex,
  onRestart,
  onGoHome,
  onPass,
  isUserTurn
}) {
  return (
    <aside className={styles.panel}>
      <div className={styles.section}>
        <ProgressBar current={current} total={total} />
      </div>

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
              <button className={buttons.primaryButton} onClick={() => onStartReplay()}>
                Replay All
              </button>
              <button className={buttons.replayAsBlack} onClick={() => onStartReplay('B')}>
                Replay as {gameInfo?.blackPlayer || 'Black'}
              </button>
              <button className={buttons.replayAsWhite} onClick={() => onStartReplay('W')}>
                Replay as {gameInfo?.whitePlayer || 'White'}
              </button>
            </div>
          </div>
        </>
      )}

      {phase === 'replay' && stats && (
        <>
          {replaySide && (
            <div className={styles.playingAs}>
              Playing as {replaySide === 'B' ? 'Black' : 'White'}
            </div>
          )}
          <div className={styles.section}>
            <button
              className={styles.passButton}
              onClick={onPass}
              disabled={!isUserTurn}
            >
              Pass
            </button>
          </div>
          <div className={styles.statsBox}>
            <div className={styles.statRow}>
              <span>Correct (1st try)</span>
              <span>{stats.correctFirstTry}</span>
            </div>
            <div className={styles.statRow}>
              <span>Wrong attempts</span>
              <span>{stats.wrongMoveCount}</span>
            </div>
          </div>
        </>
      )}

      {phase === 'complete' && (
        <>
          <div className={styles.completionStats}>
            <div className={styles.bigStat}>
              <span className={styles.bigStatValue}>{stats?.accuracy}%</span>
              <span className={styles.bigStatLabel}>Accuracy</span>
            </div>
            <div className={styles.statRow}>
              <span>Total time</span>
              <span>{stats?.totalTimeFormatted}s</span>
            </div>
            <div className={styles.statRow}>
              <span>Avg per move</span>
              <span>{stats?.avgTimeFormatted}s</span>
            </div>
          </div>

          {difficultMoves && difficultMoves.length > 0 && (
            <div className={styles.section}>
              <h3 className={styles.sectionTitle}>Mistakes</h3>
              <ul className={styles.difficultList}>
                {difficultMoves.map((move) => (
                  <li key={move.moveIndex}>
                    <button
                      className={[
                        styles.difficultItem,
                        selectedMoveIndex === move.moveIndex ? styles.selected : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelectDifficultMove(move)}
                    >
                      <span>Move {move.moveIndex + 1}</span>
                      <span className={styles.attemptBadge}>
                        {move.attemptCount} {move.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className={styles.actions}>
            <button className={buttons.button} onClick={onRestart}>
              Play Again
            </button>
            <button className={buttons.primaryButton} onClick={onGoHome}>
              New Game
            </button>
          </div>
        </>
      )}
    </aside>
  )
}
```

**Step 2: Add passButton style to RightPanel CSS**

Add to `src/styles/RightPanel.module.css`:

```css
.passButton {
  width: 100%;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #9e9e9e;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

.passButton:hover:not(:disabled) {
  background-color: #8e8e8e;
}

.passButton:active:not(:disabled) {
  background-color: #757575;
}

.passButton:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/RightPanel.jsx src/styles/RightPanel.module.css
git commit -m "feat(RightPanel): add pass button during replay phase"
```

---

## Task 6: Wire Up ReplayPhase Component

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Add handlePass function and keyboard listener**

Update `src/components/ReplayPhase.jsx`:

After the existing state declarations, add `isUserTurn` computation:

```javascript
const isUserTurn = !isComplete && gameManager.isUserMove(gameManager.replayPosition)
```

Add `handlePass` function after `handleCancel`:

```javascript
const handlePass = useCallback(() => {
  if (isComplete || !gameManager.isUserMove(gameManager.replayPosition)) return

  const result = gameManager.validatePass()

  if (result.correct) {
    setHintState(null)
    setPendingMove(null)
    setBorderFlash('success')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

    if (result.gameComplete) {
      setBottomPanelExpanded(true)
      trackCompletion(gameManager)
    } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
      scheduleOpponentMove()
    }
  } else if (result.needHint) {
    setHintState(result)
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  } else if (result.expectedPass === undefined) {
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  }
}, [gameManager, isComplete, scheduleOpponentMove])
```

Update `commitMove` to handle `expectedPass`:

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
      trackCompletion(gameManager)
    } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
      scheduleOpponentMove()
    }
  } else if (result.expectedPass) {
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  } else if (result.needHint) {
    setHintState(result)
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  }
}
```

Add keyboard event handler after the existing `useEffect`:

```javascript
useEffect(() => {
  const handleKeyDown = (event) => {
    if (event.code === 'Space' && !isComplete) {
      event.preventDefault()
      handlePass()
    }
  }

  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [handlePass, isComplete])
```

Update BottomBar usage (remove `onCancel`, add `onPass` and `isUserTurn`):

```jsx
{isMobileLayout && !isComplete && (
  <BottomBar
    current={state.replayPosition}
    total={state.totalMoves}
    replaySide={gameManager.getReplaySide()}
    pendingMove={pendingMove}
    onConfirm={handleConfirm}
    onPass={handlePass}
    isUserTurn={isUserTurn}
  />
)}
```

Update RightPanel usage (add `onPass` and `isUserTurn`):

```jsx
const rightPanelContent = (
  <RightPanel
    phase={isComplete ? 'complete' : 'replay'}
    current={state.replayPosition}
    total={state.totalMoves}
    replaySide={gameManager.getReplaySide()}
    stats={stats}
    difficultMoves={difficultMoves}
    onSelectDifficultMove={handleSelectDifficultMove}
    selectedMoveIndex={selectedDifficultMove?.moveIndex}
    onRestart={() => {
      const stats = gameManager.getCompletionStats()
      trackGameReset({ previousAccuracy: stats.accuracy })
      gameManager.resetGame()
      setSelectedDifficultMove(null)
      setPendingMove(null)
    }}
    onGoHome={() => onGoHome(state.phase)}
    onPass={handlePass}
    isUserTurn={isUserTurn}
  />
)
```

**Step 2: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 4: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat(ReplayPhase): wire up pass button and spacebar handler"
```

---

## Task 7: Manual Testing

**Step 1: Create test SGF with pass move**

Create `test-files/game-with-pass.sgf`:

```
(;GM[1]FF[4]SZ[19]
PB[Black]PW[White]
;B[pd];W[dp];B[pp];W[];B[dd])
```

**Step 2: Test scenarios**

1. Start dev server: `npm run dev`
2. Load the test SGF file
3. Start replay
4. Verify:
   - Pass button visible in right panel (desktop)
   - Pass button visible in bottom bar (mobile - resize window)
   - Spacebar triggers pass
   - Correct pass shows green border flash
   - Wrong pass (when stone expected) shows hints
   - Placing stone when pass expected shows red flash (no hints)
   - Pass moves not in Mistakes list at completion
   - Stats include pass moves in accuracy calculation

**Step 3: Commit test file**

```bash
git add test-files/game-with-pass.sgf
git commit -m "test: add SGF file with pass move for manual testing"
```

---

## Summary

After completing all tasks:
1. SGF parser includes pass moves with `isPass: true`
2. GameManager has `validatePass()` method
3. Mobile BottomBar always shows Pass + Confirm buttons
4. Desktop RightPanel has Pass button during replay
5. Spacebar triggers pass on both layouts
6. Wrong attempts handled correctly with/without hints
7. Pass moves counted in stats but excluded from Mistakes list
