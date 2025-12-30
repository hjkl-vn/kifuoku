# Mobile Touch Confirmation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add tap-to-confirm pattern for mobile replay phase to prevent accidental moves.

**Architecture:** Add `pendingMove` state to ReplayPhase. On mobile, first tap sets pending move and shows ghost stone + confirm/cancel buttons. Confirm commits the move, cancel clears it, tapping elsewhere relocates the pending stone.

**Tech Stack:** React, @sabaki/shudan (ghostStoneMap prop), CSS Modules, existing useBoardSize hook for mobile detection.

---

## Task 1: Add Ghost Stone Support to Board Component

**Files:**
- Modify: `src/components/Board.jsx`
- Modify: `src/styles/Board.module.css` (create if doesn't exist)

**Step 1: Update Board.jsx to accept ghostStoneMap prop**

```jsx
import React from 'react'
import { Goban } from '@sabaki/shudan'
import styles from '../styles/Board.module.css'

export default function Board({
  signMap,
  markerMap,
  paintMap,
  ghostStoneMap,
  onVertexClick,
  vertexSize = 34
}) {
  return (
    <div className={ghostStoneMap ? styles.hasPendingMove : ''}>
      <Goban
        animateStonePlacement={true}
        busy={false}
        fuzzyStonePlacement={true}
        showCoordinates={true}
        signMap={signMap}
        markerMap={markerMap}
        paintMap={paintMap}
        ghostStoneMap={ghostStoneMap}
        vertexSize={vertexSize}
        onVertexClick={onVertexClick}
      />
    </div>
  )
}
```

**Step 2: Create Board.module.css with pulsing animation**

```css
@keyframes pulse {
  0%, 100% {
    opacity: 0.4;
  }
  50% {
    opacity: 0.7;
  }
}

.hasPendingMove :global(.shudan-vertex.shudan-ghost) {
  animation: pulse 1s ease-in-out infinite;
}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/Board.jsx src/styles/Board.module.css
git commit -m "feat: add ghost stone support with pulsing animation to Board"
```

---

## Task 2: Add Confirm/Cancel Mode to BottomBar

**Files:**
- Modify: `src/components/BottomBar.jsx`
- Modify: `src/styles/BottomBar.module.css`

**Step 1: Update BottomBar.jsx to support confirm/cancel mode**

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
  selectedTool,
  onSelectTool,
  pendingMove,
  onConfirm,
  onCancel
}) {
  const hasNavButtons = onPrev && onNext
  const hasAnnotationTools = onSelectTool !== undefined
  const hasConfirmCancel = pendingMove && onConfirm && onCancel

  return (
    <div className={styles.container}>
      <div className={styles.progressWrapper}>
        <ProgressBar current={current} total={total} />
      </div>
      <div className={styles.controls}>
        {hasAnnotationTools && !hasConfirmCancel && (
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
        {hasConfirmCancel ? (
          <div className={styles.buttons}>
            <button className={styles.cancelButton} onClick={onCancel}>
              Cancel
            </button>
            <button className={styles.confirmButton} onClick={onConfirm}>
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

**Step 2: Add confirm/cancel button styles to BottomBar.module.css**

Add after `.button:active:not(:disabled)` block:

```css
.confirmButton {
  flex: 1;
  padding: 14px 20px;
  font-size: 16px;
  font-weight: bold;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
}

.confirmButton:active {
  background-color: #388e3c;
}

.cancelButton {
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

.cancelButton:active {
  background-color: #757575;
}
```

**Step 3: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/components/BottomBar.jsx src/styles/BottomBar.module.css
git commit -m "feat: add confirm/cancel mode to BottomBar"
```

---

## Task 3: Add Pending Move State to ReplayPhase

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Add pendingMove state and mobile confirmation logic**

Update ReplayPhase.jsx with the following changes:

1. Add state: `const [pendingMove, setPendingMove] = useState(null)`

2. Add helper to create ghost stone map:
```jsx
const createGhostStoneMap = (pendingMove, currentTurn, boardSize) => {
  if (!pendingMove) return null
  const map = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(0))
  map[pendingMove.y][pendingMove.x] = currentTurn === 'B' ? 1 : -1
  return map
}
```

3. Replace `handleVertexClick` with:
```jsx
const handleVertexClick = (evt, [x, y]) => {
  if (evt.button !== 0 || isComplete) return

  if (isMobileLayout) {
    setPendingMove({ x, y })
  } else {
    commitMove(x, y)
  }
}

const commitMove = (x, y) => {
  const result = gameManager.validateMove(x, y)

  if (result.correct) {
    setHintState(null)
    setPendingMove(null)
    setBorderFlash('success')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

    if (result.gameComplete) {
      setBottomPanelExpanded(true)
    }
  } else if (result.needHint) {
    setHintState(result)
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  }
}

const handleConfirm = () => {
  if (pendingMove) {
    commitMove(pendingMove.x, pendingMove.y)
  }
}

const handleCancel = () => {
  setPendingMove(null)
}
```

4. Add ghost stone map computation:
```jsx
const ghostStoneMap = createGhostStoneMap(pendingMove, currentTurn, state.boardSize)
```

5. Update Board component to pass ghostStoneMap:
```jsx
<Board
  signMap={board?.signMap}
  markerMap={markerMap}
  paintMap={paintMap}
  ghostStoneMap={ghostStoneMap}
  onVertexClick={handleVertexClick}
  vertexSize={vertexSize}
/>
```

6. Add BottomBar for mobile with confirm/cancel (before the `{isMobileLayout && isComplete && (` block):
```jsx
{isMobileLayout && !isComplete && (
  <BottomBar
    current={state.replayPosition}
    total={state.totalMoves}
    pendingMove={pendingMove}
    onConfirm={handleConfirm}
    onCancel={handleCancel}
  />
)}
```

7. Add BottomBar import at top:
```jsx
import BottomBar from './BottomBar'
```

**Step 2: Run build to verify no errors**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Manual test on mobile viewport**

1. Open browser dev tools, enable mobile device simulation
2. Load a game and enter replay phase
3. Tap on board - should show ghost stone with pulsing animation
4. Bottom bar should show Cancel/Confirm buttons
5. Tap Cancel - ghost stone disappears, nav buttons return
6. Tap again, then Confirm - move commits
7. Tap elsewhere on board - ghost stone moves to new position

**Step 4: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: add mobile touch confirmation to replay phase"
```

---

## Task 4: Clear Pending Move on Phase/Game Reset

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Clear pendingMove when game resets**

In the `onRestart` handler, add `setPendingMove(null)`:

```jsx
onRestart={() => {
  gameManager.resetGame()
  setSelectedDifficultMove(null)
  setPendingMove(null)
}}
```

**Step 2: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "fix: clear pending move on game restart"
```

---

## Task 5: Handle Invalid Move Taps

**Files:**
- Modify: `src/components/ReplayPhase.jsx`
- Modify: `src/game/GameManager.js`

**Step 1: Add isValidPosition method to GameManager**

Add this method to GameManager class:

```javascript
isValidPosition(x, y) {
  if (this.phase !== PHASES.REPLAY) return false
  const board = this.getCurrentBoard()
  if (!board) return false
  if (board.signMap[y]?.[x] !== 0) return false
  return true
}
```

**Step 2: Expose isValidPosition in useGameController**

Add to wrappedManager in useGameController.js:

```javascript
isValidPosition(x, y) {
  return manager.isValidPosition(x, y)
}
```

**Step 3: Update handleVertexClick to check validity before setting pending**

In ReplayPhase.jsx, update the mobile branch:

```jsx
if (isMobileLayout) {
  if (gameManager.isValidPosition(x, y)) {
    setPendingMove({ x, y })
  }
} else {
  commitMove(x, y)
}
```

**Step 4: Run build to verify**

Run: `npm run build`
Expected: Build succeeds

**Step 5: Manual test**

1. In replay phase, tap on an occupied intersection on mobile
2. No ghost stone should appear
3. Tap on empty intersection - ghost stone appears

**Step 6: Commit**

```bash
git add src/game/GameManager.js src/game/useGameController.js src/components/ReplayPhase.jsx
git commit -m "fix: prevent pending move on invalid positions"
```

---

## Summary

After completing all tasks:
- Mobile users see ghost stone with pulsing animation on tap
- Bottom bar swaps to Cancel/Confirm buttons
- Confirm commits move, Cancel clears pending state
- Tapping elsewhere relocates the pending stone
- Invalid positions (occupied squares) are ignored
- Desktop behavior remains unchanged (direct click-to-place)
