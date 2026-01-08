# PostHog Analytics Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track 6 user events to measure engagement, feature usage, and learning patterns.

**Architecture:** Create an analytics module that wraps PostHog SDK. Initialize in app entry point. Call tracking functions from existing components at phase transitions.

**Tech Stack:** posthog-js, React

---

## Task 1: Install PostHog and Create Analytics Module

**Files:**
- Create: `src/lib/analytics.js`

**Step 1: Install posthog-js**

Run: `npm install posthog-js`

**Step 2: Create analytics module**

```javascript
import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

export function initAnalytics() {
  if (!POSTHOG_KEY) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    persistence: 'localStorage'
  })
}

export function trackGameLoaded({ source, boardSize, moveCount }) {
  posthog.capture('game_loaded', {
    source,
    board_size: boardSize,
    move_count: moveCount
  })
}

export function trackReplayStarted({ side, rangeLength }) {
  posthog.capture('replay_started', {
    side: side || 'both',
    range_length: rangeLength
  })
}

export function trackReplayCompleted({ accuracy, wrongMoveCount, totalTimeSeconds, hintsUsed }) {
  posthog.capture('replay_completed', {
    accuracy,
    wrong_move_count: wrongMoveCount,
    total_time_seconds: totalTimeSeconds,
    hints_used: hintsUsed
  })
}

export function trackGameReset({ previousAccuracy }) {
  posthog.capture('game_reset', {
    previous_accuracy: previousAccuracy
  })
}

export function trackNewGameStarted({ fromPhase }) {
  posthog.capture('new_game_started', {
    from_phase: fromPhase
  })
}

export function trackAnnotationUsed() {
  posthog.capture('annotation_used')
}
```

**Step 3: Commit**

```bash
git add src/lib/analytics.js package.json package-lock.json
git commit -m "feat: add PostHog analytics module"
```

---

## Task 2: Initialize PostHog in App Entry Point

**Files:**
- Modify: `src/main.jsx`

**Step 1: Add initialization**

Import and call `initAnalytics` at top of main.jsx:

```javascript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { initAnalytics } from './lib/analytics.js'
import App from './App.jsx'
import './styles/index.css'

initAnalytics()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

**Step 2: Commit**

```bash
git add src/main.jsx
git commit -m "feat: initialize PostHog on app startup"
```

---

## Task 3: Track game_loaded Event

**Files:**
- Modify: `src/pages/HomePage.jsx:67-88`

**Step 1: Add tracking to handleFileLoaded**

Import analytics and call `trackGameLoaded` after successful parse:

```javascript
import { trackGameLoaded } from '../lib/analytics.js'
```

In `handleFileLoaded`, after `setGameInfo(info)` (around line 84), add:

```javascript
trackGameLoaded({
  source: sourceUrl ? 'ogs' : 'file',
  boardSize: size,
  moveCount: parsedMoves.length
})
```

**Step 2: Commit**

```bash
git add src/pages/HomePage.jsx
git commit -m "feat: track game_loaded event"
```

---

## Task 4: Track replay_started Event

**Files:**
- Modify: `src/components/StudyPhase.jsx:106-108`

**Step 1: Add tracking to handleStartReplay**

Import analytics:

```javascript
import { trackReplayStarted } from '../lib/analytics.js'
```

Update `handleStartReplay` function:

```javascript
const handleStartReplay = (side = null) => {
  trackReplayStarted({
    side: side || 'both',
    rangeLength: rangeEnd - rangeStart + 1
  })
  gameManager.startReplay(rangeStart, rangeEnd, side)
}
```

**Step 2: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: track replay_started event"
```

---

## Task 5: Track replay_completed Event

**Files:**
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Add tracking when game completes**

Import analytics:

```javascript
import { trackReplayCompleted } from '../lib/analytics.js'
```

Create a helper function after imports and before the component:

```javascript
function trackCompletion(gameManager) {
  const stats = gameManager.getCompletionStats()
  const gameStats = gameManager.getState().stats
  trackReplayCompleted({
    accuracy: stats.accuracy,
    wrongMoveCount: stats.wrongMoveCount,
    totalTimeSeconds: Math.round(stats.totalTimeMs / 1000),
    hintsUsed: gameStats.quadrantHintsUsed + gameStats.subdivisionHintsUsed + gameStats.exactHintsUsed
  })
}
```

Call `trackCompletion(gameManager)` in two places where `result.gameComplete` is true:

1. In `commitMove` function (around line 88), after `setBottomPanelExpanded(true)`:
```javascript
if (result.gameComplete) {
  setBottomPanelExpanded(true)
  trackCompletion(gameManager)
}
```

2. In `scheduleOpponentMove` callback (around line 50), after `setBottomPanelExpanded(true)`:
```javascript
if (result.gameComplete) {
  setBottomPanelExpanded(true)
  trackCompletion(gameManager)
}
```

**Step 2: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: track replay_completed event"
```

---

## Task 6: Track game_reset Event

**Files:**
- Modify: `src/components/ReplayPhase.jsx:191-195`

**Step 1: Add tracking to onRestart callback**

Import (add to existing import):

```javascript
import { trackReplayCompleted, trackGameReset } from '../lib/analytics.js'
```

Update the `onRestart` callback in `rightPanelContent`:

```javascript
onRestart={() => {
  const stats = gameManager.getCompletionStats()
  trackGameReset({ previousAccuracy: stats.accuracy })
  gameManager.resetGame()
  setSelectedDifficultMove(null)
  setPendingMove(null)
}}
```

**Step 2: Commit**

```bash
git add src/components/ReplayPhase.jsx
git commit -m "feat: track game_reset event"
```

---

## Task 7: Track new_game_started Event

**Files:**
- Modify: `src/pages/HomePage.jsx:103-107`
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Pass phase info to onGoHome**

In `ReplayPhase.jsx`, update the `onGoHome` call in `rightPanelContent` to pass phase:

```javascript
onGoHome={() => onGoHome(state.phase)}
```

**Step 2: Track in HomePage**

Update import in `HomePage.jsx`:

```javascript
import { trackGameLoaded, trackNewGameStarted } from '../lib/analytics.js'
```

Update `handleGoHome` to accept and track phase:

```javascript
const handleGoHome = (fromPhase = 'study') => {
  trackNewGameStarted({ fromPhase })
  setMoves(null)
  setBoardSize(null)
  setGameInfo(null)
}
```

**Step 3: Commit**

```bash
git add src/pages/HomePage.jsx src/components/ReplayPhase.jsx
git commit -m "feat: track new_game_started event"
```

---

## Task 8: Track annotation_used Event

**Files:**
- Modify: `src/components/StudyPhase.jsx:62-85`

**Step 1: Add tracking when annotation is added**

Update import:

```javascript
import { trackReplayStarted, trackAnnotationUsed } from '../lib/analytics.js'
```

In `handleBoardClick`, add tracking in the `else` branch (when adding, not removing):

```javascript
} else {
  trackAnnotationUsed()
  const newAnnotation = {
    x,
    y,
    type: selectedTool,
    label: selectedTool === 'label' ? getNextLabel(currentAnnotations) : undefined
  }

  setAnnotations((prev) => ({
    ...prev,
    [state.studyPosition]: [...currentAnnotations, newAnnotation]
  }))
}
```

**Step 2: Commit**

```bash
git add src/components/StudyPhase.jsx
git commit -m "feat: track annotation_used event"
```

---

## Task 9: Add Environment Variable Template

**Files:**
- Create: `.env.example`

**Step 1: Create env template**

```
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

**Step 2: Update .gitignore if needed**

Verify `.env` is in `.gitignore`. If not, add it.

**Step 3: Commit**

```bash
git add .env.example
git commit -m "docs: add environment variable template for PostHog"
```

---

## Task 10: Test Integration

**Step 1: Create .env.local with test key**

Create `.env.local` with your PostHog project key.

**Step 2: Run dev server and test each event**

Run: `npm run dev`

Test flow:
1. Upload SGF file → verify `game_loaded` with `source: "file"`
2. Paste OGS URL → verify `game_loaded` with `source: "ogs"`
3. Add annotation → verify `annotation_used`
4. Click "Start Replay" → verify `replay_started`
5. Complete replay → verify `replay_completed`
6. Click "Play Again" → verify `game_reset`
7. Click "New Game" → verify `new_game_started`

**Step 3: Verify in PostHog dashboard**

Check Live Events in PostHog to confirm events are arriving with correct properties.
