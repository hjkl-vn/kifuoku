# Study Phase Component Grouping Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reorganize study phase controls into logical groups matching the task flow (study → configure → replay).

**Architecture:** Move annotation toolbar from left sidebar to right panel alongside navigation. Add visual separators between Progress/Study/Replay sections. On mobile, split top collapsible into two panels (Game Info at top, Replay Setup at bottom).

**Tech Stack:** React, Tailwind CSS v4, Vitest, @testing-library/preact

---

## Task 1: Add Annotation Toolbar to StudyPanel (Desktop)

**Files:**
- Modify: `src/components/StudyPanel.jsx`
- Modify: `src/components/__tests__/StudyPanel.test.jsx`

**Step 1: Write the failing test**

Add to `src/components/__tests__/StudyPanel.test.jsx`:

```jsx
describe('Annotation Toolbar', () => {
  it('renders annotation toolbar when selectedTool and onSelectTool are provided', () => {
    render(
      <StudyPanel
        {...defaultProps}
        selectedTool={null}
        onSelectTool={vi.fn()}
      />
    )

    expect(screen.getByText('Annotate')).toBeTruthy()
  })

  it('does not render annotation toolbar when onSelectTool is not provided', () => {
    render(<StudyPanel {...defaultProps} />)

    expect(screen.queryByText('Annotate')).toBeNull()
  })
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/__tests__/StudyPanel.test.jsx`

Expected: FAIL - "Annotate" text not found

**Step 3: Update StudyPanel to accept annotation props and render toolbar**

In `src/components/StudyPanel.jsx`:

```jsx
import React, { memo } from 'react'
import PropTypes from 'prop-types'
import RangeSlider from './RangeSlider'
import { ANNOTATION_TOOLS } from '../game/constants'

const StudyPanel = memo(function StudyPanel({
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
  oneColorMode,
  onOneColorModeChange,
  selectedTool,
  onSelectTool
}) {
  const buttonBase =
    'py-3 px-5 text-base font-bold bg-primary text-white border-none rounded cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed'

  const toolButtonBase =
    'w-10 h-10 flex items-center justify-center text-xl bg-white border-2 border-gray-300 rounded-lg cursor-pointer transition-all duration-150'

  const hasAnnotationTools = onSelectTool !== undefined

  return (
    <>
      {/* Study Tools Section */}
      <div className="flex flex-col gap-3">
        <div className="flex gap-2.5">
          <button className={`${buttonBase} flex-1`} onClick={onPrev} disabled={!canGoPrev}>
            Prev
          </button>
          <button className={`${buttonBase} flex-1`} onClick={onNext} disabled={!canGoNext}>
            Next
          </button>
        </div>
        {hasAnnotationTools && (
          <div className="flex flex-col gap-2 p-3 bg-gray-100 rounded-lg">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annotate</span>
            <div className="flex gap-2">
              {ANNOTATION_TOOLS.map((tool) => (
                <button
                  key={tool.id}
                  className={[
                    toolButtonBase,
                    selectedTool === tool.id
                      ? 'border-primary bg-primary text-white'
                      : 'hover:border-primary hover:bg-blue-50'
                  ]
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
          </div>
        )}
      </div>

      {/* Replay Setup Section */}
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
        <RangeSlider
          min={0}
          max={totalMoves - 1}
          start={rangeStart}
          end={rangeEnd}
          onChange={onRangeChange}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={oneColorMode}
            onChange={(e) => onOneColorModeChange(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          One-color go
        </label>
        <div className="flex flex-col gap-2">
          <button
            className="py-4 px-8 text-lg font-bold bg-success text-white border-none rounded cursor-pointer"
            onClick={() => onStartReplay()}
          >
            Replay All
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-black text-white border-none rounded cursor-pointer hover:bg-gray-800"
            onClick={() => onStartReplay('B')}
          >
            Replay as {gameInfo?.blackPlayer || 'Black'}
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-white text-stone-black border-2 border-stone-black rounded cursor-pointer hover:bg-gray-200"
            onClick={() => onStartReplay('W')}
          >
            Replay as {gameInfo?.whitePlayer || 'White'}
          </button>
        </div>
      </div>
    </>
  )
})

StudyPanel.propTypes = {
  canGoPrev: PropTypes.bool.isRequired,
  canGoNext: PropTypes.bool.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  rangeStart: PropTypes.number.isRequired,
  rangeEnd: PropTypes.number.isRequired,
  totalMoves: PropTypes.number.isRequired,
  onRangeChange: PropTypes.func.isRequired,
  onStartReplay: PropTypes.func.isRequired,
  gameInfo: PropTypes.shape({
    blackPlayer: PropTypes.string,
    whitePlayer: PropTypes.string
  }),
  oneColorMode: PropTypes.bool.isRequired,
  onOneColorModeChange: PropTypes.func.isRequired,
  selectedTool: PropTypes.string,
  onSelectTool: PropTypes.func
}

export default StudyPanel
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/components/__tests__/StudyPanel.test.jsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/StudyPanel.jsx src/components/__tests__/StudyPanel.test.jsx
git commit -m "feat: add annotation toolbar to StudyPanel"
```

---

## Task 2: Update RightPanel to Pass Annotation Props

**Files:**
- Modify: `src/components/RightPanel.jsx`
- Modify: `src/components/__tests__/RightPanel.test.jsx`

**Step 1: Write the failing test**

Add to `src/components/__tests__/RightPanel.test.jsx` in the study phase describe block:

```jsx
it('passes annotation props to StudyPanel', () => {
  const onSelectTool = vi.fn()
  render(
    <RightPanel
      {...defaultProps}
      phase="study"
      selectedTool="triangle"
      onSelectTool={onSelectTool}
    />
  )

  expect(screen.getByText('Annotate')).toBeTruthy()
})
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/components/__tests__/RightPanel.test.jsx`

Expected: FAIL - "Annotate" text not found

**Step 3: Update RightPanel to accept and pass annotation props**

In `src/components/RightPanel.jsx`, add to props and pass to StudyPanel:

```jsx
const RightPanel = memo(function RightPanel({
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
  isUserTurn,
  oneColorMode,
  onOneColorModeChange,
  selectedTool,
  onSelectTool
}) {
  // ... existing code ...

  {phase === 'study' && (
    <StudyPanel
      canGoPrev={canGoPrev}
      canGoNext={canGoNext}
      onPrev={onPrev}
      onNext={onNext}
      rangeStart={rangeStart}
      rangeEnd={rangeEnd}
      totalMoves={totalMoves}
      onRangeChange={onRangeChange}
      onStartReplay={onStartReplay}
      gameInfo={gameInfo}
      oneColorMode={oneColorMode}
      onOneColorModeChange={onOneColorModeChange}
      selectedTool={selectedTool}
      onSelectTool={onSelectTool}
    />
  )}
```

Also add to PropTypes:

```jsx
selectedTool: PropTypes.string,
onSelectTool: PropTypes.func
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/components/__tests__/RightPanel.test.jsx`

Expected: All tests PASS

**Step 5: Commit**

```bash
git add src/components/RightPanel.jsx src/components/__tests__/RightPanel.test.jsx
git commit -m "feat: pass annotation props through RightPanel to StudyPanel"
```

---

## Task 3: Update StudyPhase Desktop to Use New Layout

**Files:**
- Modify: `src/components/StudyPhase.jsx`
- Modify: `src/components/Sidebar.jsx`

**Step 1: Update StudyPhase to pass annotation props to RightPanel (desktop)**

In `src/components/StudyPhase.jsx`, update the RightPanel usage:

```jsx
{!isMobile && (
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
    gameInfo={gameInfo}
    oneColorMode={oneColorMode}
    onOneColorModeChange={setOneColorMode}
    selectedTool={selectedTool}
    onSelectTool={setSelectedTool}
  />
)}
```

**Step 2: Remove AnnotationToolbar from Sidebar usage**

Update the Sidebar usage to remove children:

```jsx
{!isMobile && (
  <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />
)}
```

**Step 3: Simplify Sidebar component**

Update `src/components/Sidebar.jsx` to remove children prop:

```jsx
import React from 'react'
import PropTypes from 'prop-types'
import GameInfo from './GameInfo'

export default function Sidebar({ gameInfo, currentTurn }) {
  return (
    <aside className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[280px]">
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
    </aside>
  )
}

Sidebar.propTypes = {
  gameInfo: PropTypes.object,
  currentTurn: PropTypes.oneOf(['B', 'W'])
}
```

**Step 4: Remove AnnotationToolbar import from StudyPhase**

Remove this line from imports:

```jsx
import AnnotationToolbar from './AnnotationToolbar'
```

**Step 5: Run tests and lint**

Run: `npm test -- --run && npm run lint`

Expected: All tests PASS, no lint errors

**Step 6: Commit**

```bash
git add src/components/StudyPhase.jsx src/components/Sidebar.jsx
git commit -m "refactor: move annotations to right panel, simplify Sidebar"
```

---

## Task 4: Update Mobile Layout with Bottom Replay Panel

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Update mobile top CollapsiblePanel to only show GameInfo**

Replace the current mobile top CollapsiblePanel content:

```jsx
{isMobile && (
  <CollapsiblePanel
    position="top"
    title={getPlayerSummary(gameInfo)}
    expandedTitle="Hide Game Info"
  >
    <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
  </CollapsiblePanel>
)}
```

**Step 2: Add bottom CollapsiblePanel for replay setup (before BottomBar)**

Add this after the board container div and before the BottomBar:

```jsx
{isMobile && (
  <CollapsiblePanel
    position="bottom"
    title="Start Replay"
    expandedTitle="Hide Replay Options"
  >
    <div className="flex flex-col gap-3">
      <RangeSlider
        min={0}
        max={state.totalMoves - 1}
        start={rangeStart}
        end={rangeEnd}
        onChange={handleRangeChange}
      />
      <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
        <input
          type="checkbox"
          checked={oneColorMode}
          onChange={(e) => setOneColorMode(e.target.checked)}
          className="w-4 h-4 accent-primary cursor-pointer"
        />
        One-color go
      </label>
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
  </CollapsiblePanel>
)}
```

**Step 3: Run tests and lint**

Run: `npm test -- --run && npm run lint`

Expected: All tests PASS, no lint errors

**Step 4: Manual test on mobile viewport**

Run: `npm run dev`

Verify:
- Top panel shows only Game Info
- Bottom "Start Replay" panel expands to show range slider + options + replay buttons
- Bottom bar still has nav + annotation tools

**Step 5: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: add bottom replay panel for mobile study phase"
```

---

## Task 5: Adjust Mobile Layout Spacing for Two Panels

**Files:**
- Modify: `src/components/StudyPhase.jsx`
- Modify: `src/components/BottomBar.jsx` (if needed)

**Step 1: Adjust board container padding for bottom panel**

The board needs extra bottom padding to account for the collapsed bottom replay panel (50px) plus the BottomBar.

Update the board container div in mobile:

```jsx
<div
  className={[
    'flex-[2] flex flex-col items-center min-h-0 min-w-0',
    isMobile ? 'p-px flex-1 pb-[120px]' : ''
  ]
    .filter(Boolean)
    .join(' ')}
>
```

**Step 2: Adjust BottomBar z-index**

Ensure BottomBar has higher z-index than the bottom CollapsiblePanel. In `BottomBar.jsx`, the z-index is `z-[5]`. The CollapsiblePanel uses `z-20`.

Update CollapsiblePanel position bottom to use lower z-index, OR update BottomBar to use `z-[25]`:

In `src/components/BottomBar.jsx`:

```jsx
<div className="flex flex-col fixed bottom-0 left-0 right-0 px-4 py-3 bg-white border-t border-gray-300 gap-3 z-[25]">
```

**Step 3: Run dev server and test**

Run: `npm run dev`

Verify on mobile viewport:
- Bottom replay panel sits above BottomBar
- BottomBar is always visible and accessible
- No overlapping issues

**Step 4: Commit**

```bash
git add src/components/StudyPhase.jsx src/components/BottomBar.jsx
git commit -m "fix: adjust z-index and spacing for mobile two-panel layout"
```

---

## Task 6: Final Cleanup and Verification

**Files:**
- All modified files

**Step 1: Run full test suite**

Run: `npm test -- --run`

Expected: All tests PASS

**Step 2: Run lint and format check**

Run: `npm run lint && npm run format:check`

Expected: No errors

**Step 3: Manual verification checklist**

Desktop:
- [ ] Left sidebar shows only Game Info
- [ ] Right panel shows Progress Bar
- [ ] Right panel shows Prev/Next buttons with annotation toolbar below
- [ ] Visual separator between study tools and replay setup
- [ ] Range slider, one-color checkbox, replay buttons in replay section

Mobile:
- [ ] Top collapsible panel shows Game Info only
- [ ] Bottom collapsible panel shows replay setup (range, checkbox, buttons)
- [ ] Fixed bottom bar has nav buttons + annotation tools
- [ ] All panels work correctly when expanded/collapsed

**Step 4: Commit any remaining fixes**

```bash
git add -A
git commit -m "chore: cleanup study phase component grouping"
```
