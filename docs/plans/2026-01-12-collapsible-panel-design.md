# CollapsiblePanel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unify CollapsibleHeader and BottomSheet into a single CollapsiblePanel component.

**Architecture:** Create a position-aware component that slides in from top or bottom using CSS transforms. Parents pass content as children instead of props.

**Tech Stack:** React, Tailwind CSS v4

---

## Task 1: Create CollapsiblePanel Component

**Files:**
- Create: `src/components/CollapsiblePanel.jsx`

**Step 1: Create the component file**

```jsx
import React, { useState } from 'react'

export default function CollapsiblePanel({
  position = 'bottom',
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
  title = 'Show Details',
  expandedTitle,
  children
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    const newValue = !isExpanded
    if (onToggle) {
      onToggle(newValue)
    } else {
      setInternalExpanded(newValue)
    }
  }

  const isTop = position === 'top'

  const collapsedArrow = isTop ? '▼' : '▲'
  const expandedArrow = isTop ? '▲' : '▼'

  const positionClasses = isTop
    ? 'top-0 border-b'
    : 'bottom-0 border-t'

  const transformClasses = isTop
    ? isExpanded ? 'translate-y-0' : '-translate-y-[calc(100%-50px)]'
    : isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-50px)]'

  return (
    <div
      className={[
        'fixed left-0 right-0 bg-white border-gray-300 z-20 transition-transform duration-300',
        positionClasses,
        transformClasses
      ].join(' ')}
    >
      <button
        className="flex items-center justify-center gap-2 w-full h-[50px] bg-gray-100 border-none cursor-pointer text-sm font-medium hover:bg-gray-200"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <span className="text-xs">{isExpanded ? expandedArrow : collapsedArrow}</span>
        <span>{isExpanded ? (expandedTitle || title) : title}</span>
      </button>
      <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
    </div>
  )
}
```

**Step 2: Run format and lint**

Run: `npm run format && npm run lint`
Expected: No errors

**Step 3: Commit**

```bash
git add src/components/CollapsiblePanel.jsx
git commit -m "feat: add CollapsiblePanel component"
```

---

## Task 2: Update StudyPhase to use CollapsiblePanel

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Update imports**

Replace:
```jsx
import CollapsibleHeader from './CollapsibleHeader'
```

With:
```jsx
import CollapsiblePanel from './CollapsiblePanel'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
```

**Step 2: Create player summary helper**

Add after imports:
```jsx
function getPlayerSummary(gameInfo) {
  if (!gameInfo) return 'Game'
  return `${gameInfo.blackPlayer || 'Black'} ⚫ vs ${gameInfo.whitePlayer || 'White'} ⚪`
}
```

**Step 3: Replace CollapsibleHeader with CollapsiblePanel**

Replace lines 147-158:
```jsx
{isMobile && (
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
```

With:
```jsx
{isMobile && (
  <CollapsiblePanel
    position="top"
    title={getPlayerSummary(gameInfo)}
    expandedTitle="Game Info"
  >
    <div className="flex flex-col gap-4">
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
      <div className="flex flex-col gap-3">
        <RangeSlider
          min={0}
          max={state.totalMoves - 1}
          start={rangeStart}
          end={rangeEnd}
          onChange={handleRangeChange}
        />
        <div className="flex flex-col gap-2">
          <button
            className="py-4 px-8 text-lg font-bold bg-success text-white border-none rounded cursor-pointer"
            onClick={() => handleStartReplay()}
          >
            Replay All
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-black text-white border-none rounded cursor-pointer hover:bg-gray-800"
            onClick={() => handleStartReplay('B')}
          >
            Replay as {gameInfo?.blackPlayer || 'Black'}
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-white text-stone-black border-2 border-stone-black rounded cursor-pointer hover:bg-gray-200"
            onClick={() => handleStartReplay('W')}
          >
            Replay as {gameInfo?.whitePlayer || 'White'}
          </button>
        </div>
      </div>
    </div>
  </CollapsiblePanel>
)}
```

**Step 4: Run format, lint, and tests**

Run: `npm run format && npm run lint && npm test -- --run`
Expected: All pass

**Step 5: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "refactor: use CollapsiblePanel in StudyPhase"
```

---

## Task 3: Update ReplayPhase to use CollapsiblePanel

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Update imports**

Replace:
```jsx
import CollapsibleHeader from './CollapsibleHeader'
import BottomSheet from './BottomSheet'
```

With:
```jsx
import CollapsiblePanel from './CollapsiblePanel'
import GameInfo from './GameInfo'
```

**Step 2: Add player summary helper**

Add after imports (same as StudyPhase):
```jsx
function getPlayerSummary(gameInfo) {
  if (!gameInfo) return 'Game'
  return `${gameInfo.blackPlayer || 'Black'} ⚫ vs ${gameInfo.whitePlayer || 'White'} ⚪`
}
```

**Step 3: Replace CollapsibleHeader (lines 281-289)**

Replace:
```jsx
{isMobile && (
  <CollapsibleHeader
    gameInfo={gameInfo}
    phase="replay"
    current={state.replayPosition}
    total={state.totalMoves}
    stats={stats}
    currentTurn={currentTurn}
  />
)}
```

With:
```jsx
{isMobile && (
  <CollapsiblePanel
    position="top"
    title={getPlayerSummary(gameInfo)}
    expandedTitle="Game Info"
  >
    <div className="flex flex-col gap-4">
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
      <div className="bg-gray-100 rounded-lg p-3">
        <div className="flex justify-between py-1.5 text-sm">
          <span>Correct (1st try)</span>
          <span>{stats.correctFirstTry}</span>
        </div>
        <div className="flex justify-between py-1.5 text-sm">
          <span>Wrong attempts</span>
          <span>{stats.wrongMoveCount}</span>
        </div>
      </div>
    </div>
  </CollapsiblePanel>
)}
```

**Step 4: Replace BottomSheet (lines 337-345)**

Replace:
```jsx
{isMobile && isComplete && (
  <BottomSheet
    isExpanded={bottomPanelExpanded}
    onToggle={setBottomPanelExpanded}
    title="Show Stats"
    expandedTitle="Hide Stats"
  >
    {rightPanelContent}
  </BottomSheet>
)}
```

With:
```jsx
{isMobile && isComplete && (
  <CollapsiblePanel
    position="bottom"
    isExpanded={bottomPanelExpanded}
    onToggle={setBottomPanelExpanded}
    title="Show Stats"
    expandedTitle="Hide Stats"
  >
    {rightPanelContent}
  </CollapsiblePanel>
)}
```

**Step 5: Run format, lint, and tests**

Run: `npm run format && npm run lint && npm test -- --run`
Expected: All pass

**Step 6: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "refactor: use CollapsiblePanel in ReplayPhase"
```

---

## Task 4: Delete old components

**Files:**
- Delete: `src/components/CollapsibleHeader.jsx`
- Delete: `src/components/BottomSheet.jsx`

**Step 1: Delete the files**

```bash
rm src/components/CollapsibleHeader.jsx src/components/BottomSheet.jsx
```

**Step 2: Run format, lint, and tests**

Run: `npm run format && npm run lint && npm test -- --run`
Expected: All pass

**Step 3: Commit**

```bash
git add -A
git commit -m "refactor: remove CollapsibleHeader and BottomSheet"
```

---

## Task 5: Manual testing

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test mobile view**

- Open browser dev tools, enable mobile viewport
- Load an SGF file
- Verify top panel slides down when tapped (Study phase)
- Verify arrow shows ▼ when collapsed, ▲ when expanded
- Start replay, verify top panel works in Replay phase
- Complete replay, verify bottom panel slides up
- Verify arrow shows ▲ when collapsed, ▼ when expanded
- Verify text is centered in both panels

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address CollapsiblePanel issues from testing"
```
