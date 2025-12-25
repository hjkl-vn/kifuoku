# Enhanced Completion & Study Annotations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add 3-column layout with interactive difficult moves review and study annotations toolbar.

**Architecture:** Restructure layout from 2-column to 3-column (left panel | board | right panel). Right panel content varies by phase. GameManager tracks wrong attempt positions for review. Annotations are session-only React state per move.

**Tech Stack:** React, CSS Modules, Vitest, @sabaki/shudan markers

---

## Task 1: Track Wrong Attempt Positions in GameManager

**Files:**
- Modify: `src/game/GameManager.js:16-30` (constructor stats)
- Modify: `src/game/GameManager.js:152-228` (validateMove)
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the failing test**

Add to `src/game/__tests__/GameManager.test.js`:

```js
describe('Wrong Attempts Tracking', () => {
  it('tracks wrong attempt positions for each move', () => {
    const moves = [{ x: 3, y: 3, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(5, 5)

    expect(gm.getWrongAttempts(0)).toEqual([
      { x: 10, y: 10 },
      { x: 5, y: 5 }
    ])
  })

  it('clears wrong attempts after correct move', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(3, 3)
    gm.validateMove(0, 0)

    expect(gm.getWrongAttempts(0)).toEqual([{ x: 10, y: 10 }])
    expect(gm.getWrongAttempts(1)).toEqual([{ x: 0, y: 0 }])
  })

  it('getDifficultMoves returns top N moves by attempt count', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' },
      { x: 10, y: 10, color: 'B' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(0, 0)
    gm.validateMove(0, 1)
    gm.validateMove(0, 2)
    gm.validateMove(3, 3)

    gm.validateMove(15, 15)

    gm.validateMove(0, 0)
    gm.validateMove(10, 10)

    const difficult = gm.getDifficultMoves(2)
    expect(difficult).toHaveLength(2)
    expect(difficult[0].moveIndex).toBe(0)
    expect(difficult[0].attemptCount).toBe(3)
    expect(difficult[1].moveIndex).toBe(2)
    expect(difficult[1].attemptCount).toBe(1)
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL with "getWrongAttempts is not a function"

**Step 3: Write minimal implementation**

In `src/game/GameManager.js`, update constructor (around line 16-30):

```js
constructor(moves, boardSize = DEFAULT_BOARD_SIZE) {
  if (!Array.isArray(moves)) {
    throw new Error('moves must be an array')
  }
  this.moves = [...moves]
  this.boardSize = boardSize
  this.phase = PHASES.STUDY
  this.studyPosition = 0
  this.replayPosition = 0
  this.boardHistory = [Board.fromDimensions(boardSize, boardSize)]
  this.wrongAttemptsCurrentMove = 0
  this.currentHintRegion = null
  this.replayStartMove = 0
  this.replayEndMove = this.moves.length - 1
  this.wrongAttemptsByMove = []

  this.stats = {
    wrongMoveCount: 0,
    correctFirstTry: 0,
    quadrantHintsUsed: 0,
    subdivisionHintsUsed: 0,
    exactHintsUsed: 0,
    startTime: null,
    moveTimes: []
  }
}
```

In `validateMove` method, update the wrong move handling (around line 196-227):

```js
this.wrongAttemptsCurrentMove++
this.stats.wrongMoveCount++

if (!this.wrongAttemptsByMove[this.replayPosition]) {
  this.wrongAttemptsByMove[this.replayPosition] = {
    moveIndex: this.replayPosition,
    wrongAttempts: [],
    correctPosition: { x: correctMove.x, y: correctMove.y }
  }
}
this.wrongAttemptsByMove[this.replayPosition].wrongAttempts.push({ x, y })
```

Add new methods after `validateMove`:

```js
getWrongAttempts(moveIndex) {
  const record = this.wrongAttemptsByMove[moveIndex]
  return record ? record.wrongAttempts : []
}

getDifficultMoves(limit = 5) {
  return this.wrongAttemptsByMove
    .filter(record => record && record.wrongAttempts.length > 0)
    .map(record => ({
      moveIndex: record.moveIndex,
      wrongAttempts: record.wrongAttempts,
      correctPosition: record.correctPosition,
      attemptCount: record.wrongAttempts.length
    }))
    .sort((a, b) => b.attemptCount - a.attemptCount)
    .slice(0, limit)
}
```

Update `startReplay` to reset tracking:

```js
startReplay(startMove = 0, endMove = this.moves.length - 1) {
  this.phase = PHASES.REPLAY
  this.replayStartMove = startMove
  this.replayEndMove = endMove
  this.replayPosition = startMove
  this.studyPosition = startMove
  this.wrongAttemptsCurrentMove = 0
  this.wrongAttemptsByMove = []
  this.stats.startTime = Date.now()
  // ... rest unchanged
}
```

Update `resetGame` similarly:

```js
resetGame() {
  // ... existing code ...
  this.wrongAttemptsByMove = []
  // ... rest unchanged
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: track wrong attempt positions per move"
```

---

## Task 2: Add getBoardAtPosition Method

**Files:**
- Modify: `src/game/GameManager.js`
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the failing test**

```js
describe('getBoardAtPosition', () => {
  it('returns board state at given position', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validateMove(15, 15)

    const boardAt0 = gm.getBoardAtPosition(0)
    const boardAt1 = gm.getBoardAtPosition(1)

    expect(boardAt0.isEmpty()).toBe(true)
    expect(boardAt1.get([3, 3])).toBe(1)
    expect(boardAt1.get([15, 15])).toBe(0)
  })

  it('returns null for invalid position', () => {
    const gm = new GameManager([{ x: 3, y: 3, color: 'B' }], 19)
    expect(gm.getBoardAtPosition(10)).toBeNull()
    expect(gm.getBoardAtPosition(-1)).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL with "getBoardAtPosition is not a function"

**Step 3: Write minimal implementation**

Add to `GameManager.js`:

```js
getBoardAtPosition(position) {
  if (position < 0 || position >= this.boardHistory.length) {
    return null
  }
  return this.boardHistory[position]
}
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/GameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add getBoardAtPosition for reviewing past states"
```

---

## Task 3: Create RightPanel Component

**Files:**
- Create: `src/components/RightPanel.jsx`
- Create: `src/styles/RightPanel.module.css`

**Step 1: Create basic component structure**

Create `src/components/RightPanel.jsx`:

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
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex
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
            <button className={buttons.primaryButton} onClick={onStartReplay}>
              Start Replay
            </button>
          </div>
        </>
      )}

      {phase === 'replay' && stats && (
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
              <h3 className={styles.sectionTitle}>Difficult Moves</h3>
              <ul className={styles.difficultList}>
                {difficultMoves.map((move) => (
                  <li key={move.moveIndex}>
                    <button
                      className={[
                        styles.difficultItem,
                        selectedMoveIndex === move.moveIndex ? styles.selected : ''
                      ].filter(Boolean).join(' ')}
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
        </>
      )}
    </aside>
  )
}
```

**Step 2: Create styles**

Create `src/styles/RightPanel.module.css`:

```css
.panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: var(--panel-width, 280px);
  flex-shrink: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sectionTitle {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.statsBox {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
}

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #ddd;
}

.statRow:last-child {
  border-bottom: none;
}

.completionStats {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 15px;
}

.bigStat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  border-bottom: 1px solid #ddd;
  margin-bottom: 10px;
}

.bigStatValue {
  font-size: 48px;
  font-weight: bold;
  color: #2196f3;
}

.bigStatLabel {
  font-size: 14px;
  color: #666;
  text-transform: uppercase;
}

.difficultList {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.difficultItem {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.15s ease;
}

.difficultItem:hover {
  background: #f5f5f5;
  border-color: #2196f3;
}

.difficultItem.selected {
  background: #e3f2fd;
  border-color: #2196f3;
}

.attemptBadge {
  background: #ffebee;
  color: #c62828;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
```

**Step 3: Verify component renders**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/RightPanel.jsx src/styles/RightPanel.module.css
git commit -m "feat: add RightPanel component for phase-dependent content"
```

---

## Task 4: Update GameLayout CSS for 3-Column

**Files:**
- Modify: `src/styles/GameLayout.module.css`

**Step 1: Update layout styles**

Replace `src/styles/GameLayout.module.css` content:

```css
.container {
  --panel-width: 280px;
  --layout-gap: 40px;

  display: flex;
  gap: var(--layout-gap);
  flex: 1;
  min-height: 0;
  box-sizing: border-box;
  padding: 12px 20px 22px;
}

.boardArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 0;
}

.boardWrapper {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 5;
  flex: 1;
  min-height: 0;
}

.boardContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
}

.mobileLayout {
  flex-direction: column;
  gap: 0;
  padding: 0;
}

.mobileLayout .boardArea {
  padding: 1px;
  flex: 1;
}

.mobileLayout .boardWrapper {
  width: 100%;
  transform: none;
}
```

**Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/styles/GameLayout.module.css
git commit -m "refactor: update GameLayout for 3-column structure"
```

---

## Task 5: Create CollapsibleBottomPanel for Mobile

**Files:**
- Create: `src/components/CollapsibleBottomPanel.jsx`
- Create: `src/styles/CollapsibleBottomPanel.module.css`

**Step 1: Create component**

Create `src/components/CollapsibleBottomPanel.jsx`:

```jsx
import React, { useState, useEffect } from 'react'
import styles from '../styles/CollapsibleBottomPanel.module.css'

export default function CollapsibleBottomPanel({
  isExpanded: controlledExpanded,
  onToggle,
  children
}) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isExpanded)
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  return (
    <div className={[styles.container, isExpanded ? styles.expanded : ''].filter(Boolean).join(' ')}>
      <button
        className={styles.handle}
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <span className={styles.arrow}>{isExpanded ? '▼' : '▲'}</span>
        <span>{isExpanded ? 'Hide' : 'Show Stats'}</span>
      </button>
      <div className={styles.content}>
        {children}
      </div>
    </div>
  )
}
```

**Step 2: Create styles**

Create `src/styles/CollapsibleBottomPanel.module.css`:

```css
.container {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #ddd;
  z-index: 10;
  transition: transform 0.3s ease;
  transform: translateY(calc(100% - 50px));
}

.container.expanded {
  transform: translateY(0);
}

.handle {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  height: 50px;
  background: #f5f5f5;
  border: none;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.arrow {
  font-size: 12px;
}

.content {
  padding: 16px;
  max-height: 60vh;
  overflow-y: auto;
}
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/CollapsibleBottomPanel.jsx src/styles/CollapsibleBottomPanel.module.css
git commit -m "feat: add CollapsibleBottomPanel for mobile completion view"
```

---

## Task 6: Refactor StudyPhase to 3-Column Layout

**Files:**
- Modify: `src/components/StudyPhase.jsx`
- Modify: `src/components/Sidebar.jsx`

**Step 1: Update Sidebar to be left panel only**

Update `src/components/Sidebar.jsx` to only contain game info (remove controls):

```jsx
import React from 'react'
import GameInfo from './GameInfo'
import styles from '../styles/Sidebar.module.css'

export default function Sidebar({ gameInfo, currentTurn, children }) {
  return (
    <aside className={styles.sidebar}>
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
      {children}
    </aside>
  )
}
```

**Step 2: Update StudyPhase to use 3-column layout**

Update `src/components/StudyPhase.jsx`:

```jsx
import React, { useEffect, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/board-utils'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0
  const currentTurn = gameManager.getCurrentTurn()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (canGoNext) gameManager.studyNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (canGoPrev) gameManager.studyPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrev, gameManager])

  const markerMap = lastMove ? createEmptyBoardMap(state.boardSize) : null
  if (markerMap && lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  const handleRangeChange = (start, end) => {
    setRangeStart(start)
    setRangeEnd(end)
  }

  const handleStartReplay = () => {
    gameManager.startReplay(rangeStart, rangeEnd)
  }

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="study"
          totalMoves={state.totalMoves}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeChange={handleRangeChange}
          onStartReplay={handleStartReplay}
          currentTurn={currentTurn}
        />
      )}

      {!isMobileLayout && (
        <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.boardContainer} ref={containerRef}>
            <Board signMap={board.signMap} markerMap={markerMap} vertexSize={vertexSize} />
          </div>
        </div>
      </div>

      {!isMobileLayout && (
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
        />
      )}

      {isMobileLayout && (
        <BottomBar
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          current={state.studyPosition}
          total={state.totalMoves}
        />
      )}
    </div>
  )
}
```

**Step 3: Verify build and manual test**

Run: `npm run build && npm run dev`
Expected: Build succeeds, study phase shows 3 columns on desktop

**Step 4: Commit**

```bash
git add src/components/StudyPhase.jsx src/components/Sidebar.jsx
git commit -m "refactor: StudyPhase to 3-column layout"
```

---

## Task 7: Refactor ReplayPhase to 3-Column with Completion

**Files:**
- Modify: `src/components/ReplayPhase.jsx`
- Delete (or keep for reference): `src/components/CompletionModal.jsx`

**Step 1: Update ReplayPhase**

Update `src/components/ReplayPhase.jsx`:

```jsx
import React, { useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsibleHeader from './CollapsibleHeader'
import CollapsibleBottomPanel from './CollapsibleBottomPanel'
import { createEmptyBoardMap } from '../game/board-utils'
import { BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'
import replayStyles from '../styles/ReplayPhase.module.css'

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [borderFlash, setBorderFlash] = useState(null)
  const [selectedDifficultMove, setSelectedDifficultMove] = useState(null)
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false)

  const state = gameManager.getState()
  const isComplete = state.phase === PHASES.COMPLETE

  const board = selectedDifficultMove
    ? gameManager.getBoardAtPosition(selectedDifficultMove.moveIndex)
    : gameManager.getCurrentBoard()

  const lastMove = selectedDifficultMove ? null : gameManager.getLastMove()

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0 || isComplete) return

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

      if (result.gameComplete) {
        setBottomPanelExpanded(true)
      }
    } else if (result.needHint) {
      setHintState(result)
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    }
  }

  const handleSelectDifficultMove = (move) => {
    setSelectedDifficultMove(
      selectedDifficultMove?.moveIndex === move.moveIndex ? null : move
    )
  }

  const markerMap = createEmptyBoardMap(state.boardSize)
  const paintMap = createEmptyBoardMap(state.boardSize)

  if (selectedDifficultMove) {
    selectedDifficultMove.wrongAttempts.forEach(({ x, y }) => {
      markerMap[y][x] = { type: 'circle', label: '', color: '#c62828' }
    })
    const { x, y } = selectedDifficultMove.correctPosition
    markerMap[y][x] = { type: 'triangle', color: '#2e7d32' }
  } else {
    if (lastMove) {
      markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
    }

    if (hintState?.hintType === 'quadrant' && hintState.region) {
      const { minX, maxX, minY, maxY } = hintState.region
      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          paintMap[y][x] = 1
        }
      }
    }

    if (hintState?.hintType === 'exact' && hintState.position) {
      const { x, y } = hintState.position
      markerMap[y][x] = { type: 'triangle' }
    }
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? replayStyles.borderSuccess : '',
    borderFlash === 'error' ? replayStyles.borderError : ''
  ]
    .filter(Boolean)
    .join(' ')

  const stats = isComplete
    ? gameManager.getCompletionStats()
    : {
        correctFirstTry: state.stats.correctFirstTry,
        wrongMoveCount: state.stats.wrongMoveCount
      }

  const difficultMoves = isComplete ? gameManager.getDifficultMoves(5) : []
  const currentTurn = gameManager.getCurrentTurn()

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  const rightPanelContent = (
    <RightPanel
      phase={isComplete ? 'complete' : 'replay'}
      current={state.replayPosition}
      total={state.totalMoves}
      stats={stats}
      difficultMoves={difficultMoves}
      onSelectDifficultMove={handleSelectDifficultMove}
      selectedMoveIndex={selectedDifficultMove?.moveIndex}
    />
  )

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="replay"
          current={state.replayPosition}
          total={state.totalMoves}
          stats={stats}
          currentTurn={currentTurn}
        />
      )}

      {!isMobileLayout && (
        <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={boardContainerClass} ref={containerRef}>
            <Board
              signMap={board?.signMap}
              markerMap={markerMap}
              paintMap={paintMap}
              onVertexClick={handleVertexClick}
              vertexSize={vertexSize}
            />
          </div>
        </div>
      </div>

      {!isMobileLayout && rightPanelContent}

      {isMobileLayout && isComplete && (
        <CollapsibleBottomPanel
          isExpanded={bottomPanelExpanded}
          onToggle={setBottomPanelExpanded}
        >
          {rightPanelContent}
        </CollapsibleBottomPanel>
      )}
    </div>
  )
}
```

**Step 2: Verify build and manual test**

Run: `npm run build && npm run dev`
Expected: Build succeeds, replay and completion show 3 columns

**Step 3: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "refactor: ReplayPhase to 3-column with difficult moves review"
```

---

## Task 8: Add Annotation Toolbar to Sidebar

**Files:**
- Create: `src/components/AnnotationToolbar.jsx`
- Create: `src/styles/AnnotationToolbar.module.css`
- Modify: `src/components/Sidebar.jsx`

**Step 1: Create AnnotationToolbar component**

Create `src/components/AnnotationToolbar.jsx`:

```jsx
import React from 'react'
import styles from '../styles/AnnotationToolbar.module.css'

const TOOLS = [
  { id: 'circle', label: '○', title: 'Circle' },
  { id: 'triangle', label: '△', title: 'Triangle' },
  { id: 'label', label: 'A', title: 'Label' }
]

export default function AnnotationToolbar({ selectedTool, onSelectTool }) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>Annotate</span>
      <div className={styles.tools}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={[
              styles.toolButton,
              selectedTool === tool.id ? styles.selected : ''
            ].filter(Boolean).join(' ')}
            onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
            title={tool.title}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  )
}
```

**Step 2: Create styles**

Create `src/styles/AnnotationToolbar.module.css`:

```css
.toolbar {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #f5f5f5;
  border-radius: 8px;
}

.title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.tools {
  display: flex;
  gap: 8px;
}

.toolButton {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: white;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.toolButton:hover {
  border-color: #2196f3;
  background: #e3f2fd;
}

.toolButton.selected {
  border-color: #2196f3;
  background: #2196f3;
  color: white;
}
```

**Step 3: Update Sidebar to accept children**

Already done in Task 6.

**Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add src/components/AnnotationToolbar.jsx src/styles/AnnotationToolbar.module.css
git commit -m "feat: add AnnotationToolbar component"
```

---

## Task 9: Integrate Annotations into StudyPhase

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Add annotation state and board click handler**

Update `src/components/StudyPhase.jsx` to include annotation logic:

```jsx
import React, { useEffect, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import AnnotationToolbar from './AnnotationToolbar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/board-utils'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)
  const [selectedTool, setSelectedTool] = useState(null)
  const [annotations, setAnnotations] = useState({})
  const [nextLabel, setNextLabel] = useState('A')

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0
  const currentTurn = gameManager.getCurrentTurn()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (canGoNext) gameManager.studyNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (canGoPrev) gameManager.studyPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrev, gameManager])

  const currentAnnotations = annotations[state.studyPosition] || []

  const handleBoardClick = (evt, [x, y]) => {
    if (evt.button !== 0 || !selectedTool) return

    const posKey = `${x},${y}`
    const existing = currentAnnotations.find((a) => a.x === x && a.y === y)

    if (existing) {
      setAnnotations((prev) => ({
        ...prev,
        [state.studyPosition]: currentAnnotations.filter((a) => !(a.x === x && a.y === y))
      }))
    } else {
      const newAnnotation = {
        x,
        y,
        type: selectedTool,
        label: selectedTool === 'label' ? nextLabel : undefined
      }

      if (selectedTool === 'label') {
        setNextLabel(String.fromCharCode(nextLabel.charCodeAt(0) + 1))
      }

      setAnnotations((prev) => ({
        ...prev,
        [state.studyPosition]: [...currentAnnotations, newAnnotation]
      }))
    }
  }

  const markerMap = createEmptyBoardMap(state.boardSize)

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  currentAnnotations.forEach((annotation) => {
    if (annotation.type === 'label') {
      markerMap[annotation.y][annotation.x] = { type: 'label', label: annotation.label }
    } else {
      markerMap[annotation.y][annotation.x] = { type: annotation.type }
    }
  })

  const handleRangeChange = (start, end) => {
    setRangeStart(start)
    setRangeEnd(end)
  }

  const handleStartReplay = () => {
    gameManager.startReplay(rangeStart, rangeEnd)
  }

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="study"
          totalMoves={state.totalMoves}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeChange={handleRangeChange}
          onStartReplay={handleStartReplay}
          currentTurn={currentTurn}
        />
      )}

      {!isMobileLayout && (
        <Sidebar gameInfo={gameInfo} currentTurn={currentTurn}>
          <AnnotationToolbar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
          />
        </Sidebar>
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.boardContainer} ref={containerRef}>
            <Board
              signMap={board.signMap}
              markerMap={markerMap}
              vertexSize={vertexSize}
              onVertexClick={handleBoardClick}
            />
          </div>
        </div>
      </div>

      {!isMobileLayout && (
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
        />
      )}

      {isMobileLayout && (
        <BottomBar
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          current={state.studyPosition}
          total={state.totalMoves}
        />
      )}
    </div>
  )
}
```

**Step 2: Verify build and manual test**

Run: `npm run build && npm run dev`
Expected: Build succeeds, annotations work in study phase

**Step 3: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: integrate study annotations with toolbar"
```

---

## Task 10: Add Action Buttons to Completion View

**Files:**
- Modify: `src/components/RightPanel.jsx`

**Step 1: Add Play Again and New Game buttons**

Update the complete phase section in `src/components/RightPanel.jsx`:

```jsx
{phase === 'complete' && (
  <>
    <div className={styles.completionStats}>
      {/* ... existing stats ... */}
    </div>

    {difficultMoves && difficultMoves.length > 0 && (
      <div className={styles.section}>
        {/* ... existing difficult moves list ... */}
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
```

Add props to component signature:

```jsx
export default function RightPanel({
  // ... existing props ...
  onRestart,
  onGoHome
}) {
```

Add to `RightPanel.module.css`:

```css
.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: auto;
}
```

**Step 2: Update ReplayPhase to pass action handlers**

In `src/components/ReplayPhase.jsx`, update the RightPanel usage:

```jsx
<RightPanel
  phase={isComplete ? 'complete' : 'replay'}
  current={state.replayPosition}
  total={state.totalMoves}
  stats={stats}
  difficultMoves={difficultMoves}
  onSelectDifficultMove={handleSelectDifficultMove}
  selectedMoveIndex={selectedDifficultMove?.moveIndex}
  onRestart={() => {
    gameManager.resetGame()
    setSelectedDifficultMove(null)
  }}
  onGoHome={onGoHome}
/>
```

**Step 3: Verify build**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/RightPanel.jsx src/styles/RightPanel.module.css src/components/ReplayPhase.jsx
git commit -m "feat: add Play Again and New Game buttons to completion view"
```

---

## Task 11: Final Integration Test

**Step 1: Run all tests**

Run: `npm test -- --run`
Expected: All tests pass

**Step 2: Manual verification checklist**

- [ ] Desktop: 3 columns visible in study phase
- [ ] Desktop: 3 columns visible in replay phase
- [ ] Desktop: Completion stats appear in right panel
- [ ] Desktop: Difficult moves list is clickable
- [ ] Desktop: Board updates when clicking difficult move
- [ ] Desktop: Red circles on wrong attempts, green triangle on correct
- [ ] Desktop: Annotation toolbar visible in left panel during study
- [ ] Desktop: Can place circle, triangle, label markers
- [ ] Desktop: Markers persist when navigating moves
- [ ] Mobile: Top panel collapses (existing)
- [ ] Mobile: Bottom panel appears on completion
- [ ] Mobile: Bottom panel auto-expands on game complete
- [ ] Play Again resets game
- [ ] New Game returns to upload

**Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete enhanced completion and study annotations"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Track wrong attempt positions in GameManager |
| 2 | Add getBoardAtPosition method |
| 3 | Create RightPanel component |
| 4 | Update GameLayout CSS for 3-column |
| 5 | Create CollapsibleBottomPanel for mobile |
| 6 | Refactor StudyPhase to 3-column |
| 7 | Refactor ReplayPhase with completion integration |
| 8 | Add AnnotationToolbar component |
| 9 | Integrate annotations into StudyPhase |
| 10 | Add action buttons to completion view |
| 11 | Final integration test |
