# One-Color Go Mode Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a training mode where all stones render as white during replay.

**Architecture:** React state in StudyPhase controls the mode. GameManager stores it during replay. Board applies CSS class to override black stone images.

**Tech Stack:** React, Vitest, Tailwind CSS, @sabaki/shudan

---

## Task 1: Add oneColorMode to GameManager

**Files:**
- Modify: `src/game/gameManager.js:34-69` (constructor)
- Modify: `src/game/gameManager.js:84-94` (getState)
- Modify: `src/game/gameManager.js:166-186` (startReplay)
- Test: `src/game/__tests__/GameManager.test.js`

**Step 1: Write the failing test**

Add to `src/game/__tests__/GameManager.test.js` inside the `describe('GameManager')` block:

```javascript
  describe('One-Color Mode', () => {
    it('initializes oneColorMode to false', () => {
      const manager = new GameManager(mockMoves)
      const state = manager.getState()
      expect(state.oneColorMode).toBe(false)
    })

    it('stores oneColorMode when starting replay', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay(0, 2, null, true)
      const state = manager.getState()
      expect(state.oneColorMode).toBe(true)
    })

    it('defaults oneColorMode to false in startReplay', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay(0, 2)
      const state = manager.getState()
      expect(state.oneColorMode).toBe(false)
    })

    it('resets oneColorMode on resetGame', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay(0, 2, null, true)
      manager.resetGame()
      const state = manager.getState()
      expect(state.oneColorMode).toBe(false)
    })
  })
```

**Step 2: Run test to verify it fails**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: FAIL - `oneColorMode` undefined

**Step 3: Implement in GameManager**

In constructor (around line 57, after `this.wrongAttemptsByMove = []`):
```javascript
    this.oneColorMode = false
```

In `getState()` (around line 92, add to return object):
```javascript
      oneColorMode: this.oneColorMode
```

In `startReplay()` signature (line 166):
```javascript
  startReplay(startMove = 0, endMove = this.moves.length - 1, side = null, oneColorMode = false) {
```

In `startReplay()` body (after line 170, after `this.replaySide = side`):
```javascript
    this.oneColorMode = oneColorMode
```

In `resetGame()` (around line 196, after `this.wrongAttemptsByMove = []`):
```javascript
    this.oneColorMode = false
```

**Step 4: Run test to verify it passes**

Run: `npm test -- --run src/game/__tests__/GameManager.test.js`
Expected: PASS

**Step 5: Commit**

```bash
git add src/game/gameManager.js src/game/__tests__/GameManager.test.js
git commit -m "feat: add oneColorMode state to GameManager"
```

---

## Task 2: Add oneColorMode prop to Board component

**Files:**
- Modify: `src/components/Board.jsx`

**Step 1: Add prop and apply CSS class**

Update `src/components/Board.jsx`:

```javascript
import React from 'react'
import { Goban } from '@sabaki/shudan'

export default function Board({
  signMap,
  markerMap,
  paintMap,
  ghostStoneMap,
  onVertexClick,
  onVertexMouseEnter,
  onVertexMouseLeave,
  vertexSize = 34,
  oneColorMode = false
}) {
  return (
    <div
      className={[ghostStoneMap ? 'has-pending-move' : '', oneColorMode ? 'one-color-mode' : '']
        .filter(Boolean)
        .join(' ')}
    >
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

**Step 2: Run lint to verify syntax**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/Board.jsx
git commit -m "feat: add oneColorMode prop to Board component"
```

---

## Task 3: Add CSS overrides for one-color mode

**Files:**
- Modify: `src/index.css`

**Step 1: Add CSS rules**

Append to `src/index.css`:

```css
.one-color-mode .shudan-stone-image.shudan-sign_1 {
  background-image: url('../node_modules/@sabaki/shudan/css/stone_-1.svg');
}

.one-color-mode .shudan-vertex.shudan-ghost_1 .shudan-ghost::before {
  background: url('../node_modules/@sabaki/shudan/css/stone_-1.svg');
  background-size: 100% 100%;
}
```

**Step 2: Run build to verify CSS is valid**

Run: `npm run build`
Expected: PASS

**Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add one-color-mode CSS overrides"
```

---

## Task 4: Pass oneColorMode from ReplayPhase to Board

**Files:**
- Modify: `src/components/ReplayPhase.jsx:319-328`

**Step 1: Add oneColorMode to Board props**

In `src/components/ReplayPhase.jsx`, update the Board component (around line 319):

```javascript
              <Board
                signMap={board?.signMap}
                markerMap={markerMap}
                paintMap={paintMap}
                ghostStoneMap={ghostStoneMap}
                onVertexClick={handleVertexClick}
                onVertexMouseEnter={handleVertexMouseEnter}
                onVertexMouseLeave={handleVertexMouseLeave}
                vertexSize={vertexSize}
                oneColorMode={state.oneColorMode}
              />
```

**Step 2: Run lint to verify syntax**

Run: `npm run lint`
Expected: PASS

**Step 3: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: pass oneColorMode from ReplayPhase to Board"
```

---

## Task 5: Add checkbox UI to StudyPhase

**Files:**
- Modify: `src/components/StudyPhase.jsx`

**Step 1: Add state and update handleStartReplay**

In `src/components/StudyPhase.jsx`:

Add state (after line 25, after annotations state):
```javascript
  const [oneColorMode, setOneColorMode] = useState(false)
```

Update `handleStartReplay` (line 135-141):
```javascript
  const handleStartReplay = (side = null) => {
    trackReplayStarted({
      side: side || 'both',
      rangeLength: rangeEnd - rangeStart + 1
    })
    gameManager.startReplay(rangeStart, rangeEnd, side, oneColorMode)
  }
```

**Step 2: Add checkbox UI for desktop (RightPanel area)**

Create a reusable checkbox element. After the `<RangeSlider ... />` in the desktop section (around line 234, after the RangeSlider closing tag), add:

```javascript
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={oneColorMode}
                onChange={(e) => setOneColorMode(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              One-color go
            </label>
```

**Step 3: Add checkbox UI for mobile (CollapsiblePanel)**

In the mobile CollapsiblePanel section (around line 165, after the RangeSlider inside CollapsiblePanel), add the same checkbox:

```javascript
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={oneColorMode}
                  onChange={(e) => setOneColorMode(e.target.checked)}
                  className="w-4 h-4 accent-primary cursor-pointer"
                />
                One-color go
              </label>
```

**Step 4: Run lint and build**

Run: `npm run lint && npm run build`
Expected: PASS

**Step 5: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: add one-color go checkbox to StudyPhase"
```

---

## Task 6: Manual Testing

**Steps:**

1. Run: `npm run dev`
2. Load an SGF file
3. In Study Phase, check "One-color go" checkbox
4. Click "Replay All" - verify all stones appear white
5. Complete or restart, uncheck the box
6. Click "Replay as Black" - verify stones still appear in correct colors
7. Check box again, click "Replay as White" - verify all stones appear white
8. Start a new game - verify checkbox is unchecked (reset)

---

## Files Changed Summary

1. `src/game/gameManager.js` - Add oneColorMode param and state
2. `src/game/__tests__/GameManager.test.js` - Add tests for oneColorMode
3. `src/components/Board.jsx` - Add oneColorMode prop, apply CSS class
4. `src/index.css` - Add one-color-mode CSS overrides
5. `src/components/ReplayPhase.jsx` - Pass oneColorMode to Board
6. `src/components/StudyPhase.jsx` - Add checkbox state and UI
