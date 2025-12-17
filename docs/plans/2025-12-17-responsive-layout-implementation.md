# Responsive Layout Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the 3-column layout to a responsive 2-column (desktop) / collapsible header (mobile) layout.

**Architecture:** Desktop uses left sidebar + board area. Mobile uses collapsible header overlay + board + fixed bottom bar. Breakpoint at 768px. The board is the star; all other UI is secondary.

**Tech Stack:** React, CSS Modules, existing component library

---

## Task 1: Update ProgressBar to Show Move Count Inside

**Files:**
- Modify: `src/components/ProgressBar.jsx`
- Modify: `src/components/ProgressBar.module.css`

**Step 1: Update ProgressBar component**

Replace contents of `src/components/ProgressBar.jsx`:

```jsx
import React from 'react'
import styles from './ProgressBar.module.css'

export default function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div className={styles.container}>
      <div className={styles.barBackground}>
        <div className={styles.barFill} style={{ width: `${percentage}%` }} />
        <span className={styles.text}>{current} / {total}</span>
      </div>
    </div>
  )
}
```

**Step 2: Update ProgressBar CSS**

Replace contents of `src/components/ProgressBar.module.css`:

```css
.container {
  width: 100%;
}

.barBackground {
  position: relative;
  width: 100%;
  height: 28px;
  background-color: #e0e0e0;
  border-radius: 14px;
  overflow: hidden;
}

.barFill {
  height: 100%;
  background-color: #2196F3;
  transition: width 0.3s ease;
}

.text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 14px;
  font-weight: bold;
  color: #333;
  text-shadow: 0 0 2px rgba(255, 255, 255, 0.8);
}
```

**Step 3: Verify visually**

Run: `npm run dev`

Open browser, load an SGF file, verify progress bar shows "X / Y" inside the bar.

**Step 4: Commit**

```bash
git add src/components/ProgressBar.jsx src/components/ProgressBar.module.css
git commit -m "feat: show move count inside progress bar"
```

---

## Task 2: Create Sidebar Component for Desktop

**Files:**
- Create: `src/components/Sidebar.jsx`
- Create: `src/components/Sidebar.module.css`

**Step 1: Create Sidebar component**

Create `src/components/Sidebar.jsx`:

```jsx
import React from 'react'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
import styles from './Sidebar.module.css'
import buttons from '../styles/buttons.module.css'

export default function Sidebar({
  gameInfo,
  phase,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  stats
}) {
  return (
    <aside className={styles.sidebar}>
      <GameInfo gameInfo={gameInfo} />

      <div className={styles.section}>
        <div className={buttons.controls}>
          <button
            className={buttons.buttonFlex}
            onClick={onPrev}
            disabled={!canGoPrev}
          >
            Prev
          </button>
          <button
            className={buttons.buttonFlex}
            onClick={onNext}
            disabled={!canGoNext}
          >
            Next
          </button>
        </div>
      </div>

      {phase === 'study' && (
        <div className={styles.section}>
          <RangeSlider
            min={0}
            max={totalMoves - 1}
            start={rangeStart}
            end={rangeEnd}
            onChange={onRangeChange}
          />
          <button
            className={buttons.primaryButton}
            onClick={onStartReplay}
          >
            Start Replay
          </button>
        </div>
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
    </aside>
  )
}
```

**Step 2: Create Sidebar CSS**

Create `src/components/Sidebar.module.css`:

```css
.sidebar {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 280px;
  flex-shrink: 0;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}
```

**Step 3: Commit**

```bash
git add src/components/Sidebar.jsx src/components/Sidebar.module.css
git commit -m "feat: add Sidebar component for desktop layout"
```

---

## Task 3: Create CollapsibleHeader Component for Mobile

**Files:**
- Create: `src/components/CollapsibleHeader.jsx`
- Create: `src/components/CollapsibleHeader.module.css`

**Step 1: Create CollapsibleHeader component**

Create `src/components/CollapsibleHeader.jsx`:

```jsx
import React, { useState } from 'react'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
import styles from './CollapsibleHeader.module.css'
import buttons from '../styles/buttons.module.css'

export default function CollapsibleHeader({
  gameInfo,
  phase,
  current,
  total,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  stats
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const playerSummary = gameInfo
    ? `${gameInfo.blackPlayer || 'Black'} vs ${gameInfo.whitePlayer || 'White'}`
    : 'Game'

  return (
    <div className={styles.container}>
      <button
        className={styles.headerBar}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className={styles.arrow}>{isExpanded ? '▲' : '▼'}</span>
        <span className={styles.summary}>{playerSummary}</span>
        <span className={styles.moveCount}>{current}/{total}</span>
      </button>

      {isExpanded && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setIsExpanded(false)}
          />
          <div className={styles.dropdown}>
            <GameInfo gameInfo={gameInfo} />

            {phase === 'study' && (
              <div className={styles.section}>
                <RangeSlider
                  min={0}
                  max={totalMoves - 1}
                  start={rangeStart}
                  end={rangeEnd}
                  onChange={onRangeChange}
                />
                <button
                  className={buttons.primaryButton}
                  onClick={() => {
                    onStartReplay()
                    setIsExpanded(false)
                  }}
                >
                  Start Replay
                </button>
              </div>
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
          </div>
        </>
      )}
    </div>
  )
}
```

**Step 2: Create CollapsibleHeader CSS**

Create `src/components/CollapsibleHeader.module.css`:

```css
.container {
  display: none;
  position: relative;
}

@media (max-width: 767px) {
  .container {
    display: block;
  }
}

.headerBar {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 12px 16px;
  background-color: #f5f5f5;
  border: none;
  border-bottom: 1px solid #ddd;
  cursor: pointer;
  font-size: 14px;
}

.headerBar:hover {
  background-color: #ebebeb;
}

.arrow {
  margin-right: 8px;
  font-size: 12px;
}

.summary {
  flex: 1;
  text-align: left;
  font-weight: 500;
}

.moveCount {
  font-weight: bold;
  color: #2196F3;
}

.overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.3);
  z-index: 10;
}

.dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background-color: white;
  border-bottom: 1px solid #ddd;
  padding: 16px;
  z-index: 11;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.statsBox {
  background-color: #f5f5f5;
  border-radius: 8px;
  padding: 12px;
}

.statRow {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  font-size: 14px;
}
```

**Step 3: Commit**

```bash
git add src/components/CollapsibleHeader.jsx src/components/CollapsibleHeader.module.css
git commit -m "feat: add CollapsibleHeader component for mobile layout"
```

---

## Task 4: Create BottomBar Component for Mobile

**Files:**
- Create: `src/components/BottomBar.jsx`
- Create: `src/components/BottomBar.module.css`

**Step 1: Create BottomBar component**

Create `src/components/BottomBar.jsx`:

```jsx
import React from 'react'
import styles from './BottomBar.module.css'

export default function BottomBar({ canGoPrev, canGoNext, onPrev, onNext }) {
  return (
    <div className={styles.container}>
      <button
        className={styles.button}
        onClick={onPrev}
        disabled={!canGoPrev}
      >
        ◀ Prev
      </button>
      <button
        className={styles.button}
        onClick={onNext}
        disabled={!canGoNext}
      >
        Next ▶
      </button>
    </div>
  )
}
```

**Step 2: Create BottomBar CSS**

Create `src/components/BottomBar.module.css`:

```css
.container {
  display: none;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 12px 16px;
  background-color: white;
  border-top: 1px solid #ddd;
  gap: 12px;
  z-index: 5;
}

@media (max-width: 767px) {
  .container {
    display: flex;
  }
}

.button {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.button:disabled {
  background-color: #ccc;
  cursor: not-allowed;
}

.button:active:not(:disabled) {
  background-color: #1976D2;
}
```

**Step 3: Commit**

```bash
git add src/components/BottomBar.jsx src/components/BottomBar.module.css
git commit -m "feat: add BottomBar component for mobile navigation"
```

---

## Task 5: Create New Game Layout CSS

**Files:**
- Create: `src/styles/gameLayout.module.css`

**Step 1: Create the layout CSS**

Create `src/styles/gameLayout.module.css`:

```css
.container {
  display: flex;
  gap: 40px;
  padding: 20px;
  min-height: 100vh;
  box-sizing: border-box;
}

.boardArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.progressBarWrapper {
  width: 100%;
  max-width: 600px;
}

.boardContainer {
  display: flex;
  justify-content: center;
}

@media (max-width: 767px) {
  .container {
    flex-direction: column;
    gap: 0;
    padding: 0;
    padding-bottom: 70px;
  }

  .boardArea {
    padding: 16px;
  }

  .progressBarWrapper {
    max-width: none;
  }
}
```

**Step 2: Commit**

```bash
git add src/styles/gameLayout.module.css
git commit -m "feat: add responsive game layout CSS"
```

---

## Task 6: Update StudyPhase Component

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Replace StudyPhase component**

Replace contents of `src/components/StudyPhase.jsx`:

```jsx
import React, { useEffect, useState } from 'react'
import Board from './Board'
import ProgressBar from './ProgressBar'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/board-utils'
import layout from '../styles/gameLayout.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)

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

  return (
    <div className={layout.container}>
      <CollapsibleHeader
        gameInfo={gameInfo}
        phase="study"
        current={state.studyPosition}
        total={state.totalMoves}
        totalMoves={state.totalMoves}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeChange={handleRangeChange}
        onStartReplay={handleStartReplay}
      />

      <Sidebar
        gameInfo={gameInfo}
        phase="study"
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => gameManager.studyPrev()}
        onNext={() => gameManager.studyNext()}
        totalMoves={state.totalMoves}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeChange={handleRangeChange}
        onStartReplay={handleStartReplay}
      />

      <div className={layout.boardArea}>
        <div className={layout.progressBarWrapper}>
          <ProgressBar current={state.studyPosition} total={state.totalMoves} />
        </div>
        <div className={layout.boardContainer}>
          <Board signMap={board.signMap} markerMap={markerMap} />
        </div>
      </div>

      <BottomBar
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => gameManager.studyPrev()}
        onNext={() => gameManager.studyNext()}
      />
    </div>
  )
}
```

**Step 2: Verify visually on desktop**

Run: `npm run dev`

Open browser at full width, load an SGF file. Verify:
- Left sidebar with GameInfo, Prev/Next, Range slider, Start Replay button
- Board area with progress bar above
- No right panel

**Step 3: Verify visually on mobile**

Open browser dev tools, enable responsive mode, set to 375px width. Verify:
- Collapsible header at top (collapsed by default)
- Tap header to expand and see all controls
- Fixed bottom bar with Prev/Next
- Board centered

**Step 4: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "refactor: update StudyPhase to use new responsive layout"
```

---

## Task 7: Update ReplayPhase Component

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Replace ReplayPhase component**

Replace contents of `src/components/ReplayPhase.jsx`:

```jsx
import React, { useState } from 'react'
import Board from './Board'
import ProgressBar from './ProgressBar'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import CompletionModal from './CompletionModal'
import { createEmptyBoardMap } from '../game/board-utils'
import { HINT_LETTERS, BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
import layout from '../styles/gameLayout.module.css'
import styles from './ReplayPhase.module.css'

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedLetters, setEliminatedLetters] = useState([])
  const [borderFlash, setBorderFlash] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return

    if (hintState?.hintType === 'ghost') {
      const clickResult = gameManager.handleGhostClick(x, y)

      if (clickResult.error) return

      if (clickResult.correct) {
        setHintState(null)
        setEliminatedLetters([])
        setBorderFlash('success')
        setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
      } else {
        setEliminatedLetters(prev => [...prev, { x, y }])
      }
      return
    }

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    } else if (result.needHint) {
      setHintState(result)
      setEliminatedLetters([])
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    }
  }

  const markerMap = createEmptyBoardMap(state.boardSize)
  const paintMap = createEmptyBoardMap(state.boardSize)

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  if (hintState?.hintType === 'quadrant' && hintState.vertices) {
    hintState.vertices.forEach(([x, y]) => {
      paintMap[y][x] = 1
    })
  }

  if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
    hintState.ghostStones.forEach((ghost, index) => {
      const isEliminated = eliminatedLetters.some(g => g.x === ghost.x && g.y === ghost.y)
      if (!isEliminated) {
        markerMap[ghost.y][ghost.x] = { type: 'label', label: HINT_LETTERS[index] }
      }
    })
  }

  if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
    const { x, y } = hintState.correctPosition
    markerMap[y][x] = { type: 'point' }
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? styles.borderSuccess : '',
    borderFlash === 'error' ? styles.borderError : ''
  ].filter(Boolean).join(' ')

  const stats = {
    correctFirstTry: state.stats.correctFirstTry,
    wrongMoveCount: state.stats.wrongMoveCount
  }

  return (
    <div className={layout.container}>
      <CollapsibleHeader
        gameInfo={gameInfo}
        phase="replay"
        current={state.replayPosition}
        total={state.totalMoves}
        stats={stats}
      />

      <Sidebar
        gameInfo={gameInfo}
        phase="replay"
        canGoPrev={false}
        canGoNext={false}
        stats={stats}
      />

      <div className={layout.boardArea}>
        <div className={layout.progressBarWrapper}>
          <ProgressBar current={state.replayPosition} total={state.totalMoves} />
        </div>
        <div className={boardContainerClass}>
          <Board
            signMap={board.signMap}
            markerMap={markerMap}
            paintMap={paintMap}
            onVertexClick={handleVertexClick}
          />
        </div>
      </div>

      <BottomBar
        canGoPrev={false}
        canGoNext={false}
      />

      {state.phase === PHASES.COMPLETE && (
        <CompletionModal
          stats={gameManager.getCompletionStats()}
          onRestart={() => gameManager.resetGame()}
          onGoHome={onGoHome}
        />
      )}
    </div>
  )
}
```

**Step 2: Verify visually**

Run: `npm run dev`

Load SGF, go through study phase, start replay. Verify:
- Desktop: Sidebar shows stats (correct/wrong), no Prev/Next buttons active
- Mobile: Collapsible header shows stats when expanded
- Board flashes work correctly

**Step 3: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "refactor: update ReplayPhase to use new responsive layout"
```

---

## Task 8: Clean Up Old Layout CSS

**Files:**
- Modify: `src/styles/layout.module.css`

**Step 1: Remove unused layout styles**

The old layout.module.css had 3-column layout styles. Most are no longer needed. Keep only what might be used elsewhere or remove entirely.

Check if any other files import from layout.module.css:

```bash
grep -r "layout.module.css" src/ --include="*.jsx"
```

If only StudyPhase and ReplayPhase used it (now updated), delete the file:

```bash
rm src/styles/layout.module.css
```

Or if other components use shared styles (like statsBox), keep only those.

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove unused 3-column layout CSS"
```

---

## Task 9: Final Testing

**Step 1: Test desktop layout**

Run: `npm run dev`

Test checklist:
- [ ] Load SGF file
- [ ] Sidebar visible on left with GameInfo
- [ ] Prev/Next buttons work
- [ ] Range slider visible and functional
- [ ] Start Replay button works
- [ ] Progress bar shows "X / Y" inside
- [ ] Replay phase shows stats in sidebar
- [ ] Completion modal appears

**Step 2: Test mobile layout (375px width)**

Test checklist:
- [ ] Collapsible header shows player names and move count
- [ ] Tap header expands overlay with full info
- [ ] Tap outside overlay closes it
- [ ] Range slider works in expanded header
- [ ] Start Replay works from expanded header
- [ ] Bottom bar Prev/Next buttons work
- [ ] Keyboard navigation still works
- [ ] Replay phase shows stats in expanded header

**Step 3: Test tablet layout (768px exactly)**

- [ ] Verify breakpoint - at 768px should show desktop layout
- [ ] At 767px should show mobile layout

**Step 4: Run build**

```bash
npm run build
```

Verify no build errors.

**Step 5: Final commit**

```bash
git add -A
git commit -m "test: verify responsive layout implementation"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Update ProgressBar to show move count inside |
| 2 | Create Sidebar component for desktop |
| 3 | Create CollapsibleHeader component for mobile |
| 4 | Create BottomBar component for mobile |
| 5 | Create new game layout CSS |
| 6 | Update StudyPhase to use new components |
| 7 | Update ReplayPhase to use new components |
| 8 | Clean up old layout CSS |
| 9 | Final testing |
