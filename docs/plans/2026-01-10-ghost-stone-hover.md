# Ghost Stone Hover Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Display ghost stones and annotation markers on hover to improve clarity and prevent misclicks.

**Architecture:** Add mouse enter/leave event handlers to Board component, track hover state in phase components, render context-aware previews via existing Shudan props. Desktop only via CSS media query.

**Tech Stack:** React, @sabaki/shudan (Goban component), CSS Modules

---

## Task 1: Add Hover Event Props to Board Component

**Files:**
- Modify: `src/components/Board.jsx`

**Step 1: Add onVertexMouseEnter and onVertexMouseLeave props**

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
  onVertexMouseEnter,
  onVertexMouseLeave,
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
        onVertexMouseEnter={onVertexMouseEnter}
        onVertexMouseLeave={onVertexMouseLeave}
      />
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add src/components/Board.jsx
git commit -m "feat(board): add hover event handler props"
```

---

## Task 2: Add Hover Ghost Stone to ReplayPhase

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Add hoverVertex state**

After line 42 (`const [pendingMove, setPendingMove] = useState(null)`), add:

```jsx
const [hoverVertex, setHoverVertex] = useState(null)
```

**Step 2: Add hover event handlers**

After the `handlePass` useCallback (around line 159), add:

```jsx
const handleVertexMouseEnter = useCallback(
  (evt, [x, y]) => {
    if (isComplete || !isUserTurn || isMobileLayout) return
    if (!gameManager.isValidPosition(x, y)) return
    setHoverVertex({ x, y })
  },
  [gameManager, isComplete, isUserTurn, isMobileLayout]
)

const handleVertexMouseLeave = useCallback(() => {
  setHoverVertex(null)
}, [])
```

**Step 3: Update createGhostStoneMap call to include hover**

Replace line 229:
```jsx
const ghostStoneMap = createGhostStoneMap(pendingMove, currentTurn, state.boardSize)
```

With:
```jsx
const ghostStoneMap = createGhostStoneMap(
  pendingMove || hoverVertex,
  currentTurn,
  state.boardSize
)
```

**Step 4: Pass hover handlers to Board component**

Update the Board component (around line 276-283) to include new props:

```jsx
<Board
  signMap={board?.signMap}
  markerMap={markerMap}
  paintMap={paintMap}
  ghostStoneMap={ghostStoneMap}
  onVertexClick={handleVertexClick}
  onVertexMouseEnter={handleVertexMouseEnter}
  onVertexMouseLeave={handleVertexMouseLeave}
  vertexSize={vertexSize}
/>
```

**Step 5: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat(replay): add ghost stone preview on hover"
```

---

## Task 3: Add Hover Marker Preview to StudyPhase

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Add hoverVertex state**

After line 21 (`const [annotations, setAnnotations] = useState({})`), add:

```jsx
const [hoverVertex, setHoverVertex] = useState(null)
```

**Step 2: Add hover event handlers**

After the `handleRangeChange` function (around line 106), add:

```jsx
const handleVertexMouseEnter = (evt, [x, y]) => {
  if (!selectedTool || isMobileLayout) return
  setHoverVertex({ x, y })
}

const handleVertexMouseLeave = () => {
  setHoverVertex(null)
}
```

**Step 3: Add hover preview to markerMap**

After line 101 (after the `currentAnnotations.forEach` block), add:

```jsx
if (hoverVertex && selectedTool && !isMobileLayout) {
  const existingMarker = markerMap[hoverVertex.y][hoverVertex.x]
  if (!existingMarker) {
    markerMap[hoverVertex.y][hoverVertex.x] = {
      type: selectedTool === 'label' ? 'label' : selectedTool,
      label: selectedTool === 'label' ? '?' : undefined,
      hover: true
    }
  }
}
```

**Step 4: Pass hover handlers to Board component**

Update the Board component (around line 144-149) to include new props:

```jsx
<Board
  signMap={board.signMap}
  markerMap={markerMap}
  vertexSize={vertexSize}
  onVertexClick={handleBoardClick}
  onVertexMouseEnter={handleVertexMouseEnter}
  onVertexMouseLeave={handleVertexMouseLeave}
/>
```

**Step 5: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat(study): add annotation marker preview on hover"
```

---

## Task 4: Add Hover-Specific CSS Styling

**Files:**
- Modify: `src/styles/Board.module.css`

**Step 1: Add hover ghost stone styles with media query**

Append to the file:

```css
@media (hover: hover) and (pointer: fine) {
  .hasHoverPreview :global(.shudan-vertex .shudan-ghost) {
    opacity: 0.4;
    animation: none;
  }

  .hasHoverPreview :global(.shudan-vertex .shudan-marker) {
    opacity: 0.5;
  }
}
```

**Step 2: Commit**

```bash
git add src/styles/Board.module.css
git commit -m "feat(styles): add desktop-only hover preview styles"
```

---

## Task 5: Add CSS Class Toggle for Hover State

**Files:**
- Modify: `src/components/Board.jsx`

**Step 1: Accept hasHoverPreview prop and apply class**

Update Board.jsx to conditionally apply the hover class:

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
  onVertexMouseEnter,
  onVertexMouseLeave,
  vertexSize = 34,
  hasHoverPreview = false
}) {
  const containerClass = [
    ghostStoneMap && !hasHoverPreview ? styles.hasPendingMove : '',
    hasHoverPreview ? styles.hasHoverPreview : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass}>
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
        onVertexMouseEnter={onVertexMouseEnter}
        onVertexMouseLeave={onVertexMouseLeave}
      />
    </div>
  )
}
```

**Step 2: Pass hasHoverPreview from ReplayPhase**

In ReplayPhase.jsx, update the Board component:

```jsx
<Board
  signMap={board?.signMap}
  markerMap={markerMap}
  paintMap={paintMap}
  ghostStoneMap={ghostStoneMap}
  onVertexClick={handleVertexClick}
  onVertexMouseEnter={handleVertexMouseEnter}
  onVertexMouseLeave={handleVertexMouseLeave}
  vertexSize={vertexSize}
  hasHoverPreview={!!hoverVertex && !pendingMove}
/>
```

**Step 3: Pass hasHoverPreview from StudyPhase**

In StudyPhase.jsx, update the Board component:

```jsx
<Board
  signMap={board.signMap}
  markerMap={markerMap}
  vertexSize={vertexSize}
  onVertexClick={handleBoardClick}
  onVertexMouseEnter={handleVertexMouseEnter}
  onVertexMouseLeave={handleVertexMouseLeave}
  hasHoverPreview={!!hoverVertex && !!selectedTool}
/>
```

**Step 4: Commit**

```bash
git add src/components/Board.jsx src/components/ReplayPhase.jsx src/components/StudyPhase.jsx
git commit -m "feat: toggle hover preview styling via hasHoverPreview prop"
```

---

## Task 6: Manual Testing

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test replay phase hover**

1. Load an SGF file
2. Start replay
3. Hover over empty intersections - verify ghost stone appears in correct color
4. Hover over occupied intersections - verify no ghost appears
5. Complete a move - verify hover clears

**Step 3: Test study phase hover**

1. Load an SGF file (stay in study phase)
2. Select circle tool - hover over board - verify circle preview appears
3. Select triangle tool - verify triangle preview
4. Select cross tool - verify cross preview
5. Select label tool - verify "?" label preview
6. Deselect tool - verify no hover preview

**Step 4: Test mobile behavior unchanged**

1. Use Chrome DevTools device emulation (iPhone or similar)
2. Verify no hover effects appear
3. Verify tap behavior works as before

**Step 5: Commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found in manual testing"
```

---

## Summary

| Task | Description |
|------|-------------|
| 1 | Add hover event props to Board component |
| 2 | Add hover ghost stone to ReplayPhase |
| 3 | Add hover marker preview to StudyPhase |
| 4 | Add hover-specific CSS with media query |
| 5 | Add CSS class toggle for hover state |
| 6 | Manual testing |
