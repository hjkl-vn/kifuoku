# Enhanced Completion & Study Annotations

## Overview

Two features to improve the core gameplay loop:
1. **Enhanced completion with difficult moves review** - better reward for effort, interactive review of mistakes
2. **Study annotations** - place markers on the board during study phase

---

## Layout Restructure

### Desktop (3-column)

```
┌─────────────┬──────────────────┬─────────────┐
│  Left Panel │      Board       │ Right Panel │
│             │                  │             │
│ - Game info │                  │ (varies by  │
│ - Toolbar   │                  │   phase)    │
│             │                  │             │
└─────────────┴──────────────────┴─────────────┘
```

**Right panel content by phase:**
- **Study:** navigation controls, range selection
- **Replay:** current progress, live stats (correct/wrong counts)
- **Complete:** final stats + "top 5 difficult moves" list

### Mobile

- **Left panel:** collapsible from top (existing behavior)
- **Right panel:** collapsible from bottom
  - Auto-expands when replay phase completes
  - Tapping a difficult move updates the board above
  - User can collapse/expand as needed

---

## Feature 1: Difficult Moves Review

### Data Tracking (GameManager)

Store wrong attempt positions for each move, not just count:

```js
wrongAttemptsByMove: [
  {
    moveIndex: 47,
    wrongAttempts: [{x: 3, y: 4}, {x: 5, y: 6}, ...],
    correctPosition: {x: 10, y: 10},
    attemptCount: 4
  },
  ...
]
```

### UI: Top 5 Difficult Moves List

- Appears in right panel on completion
- Sorted by attempt count (most attempts first)
- Each item shows: move number, attempt count (e.g., "Move 47 - 4 attempts")
- Hover/click updates the main board

### Board Markers When Reviewing

- **Red circles:** positions where they clicked wrong
- **Green triangle:** the correct position
- Board shows the state *before* that move was played (context for the decision)

### Interaction

- Clicking a move in the list updates the board to that position with markers
- Clicking a different move switches the view
- No special "exit" needed - just part of the completion panel

---

## Feature 2: Study Annotations

### Toolbar (Left Panel)

- Three buttons: ○ (circle), △ (triangle), A (label)
- Visual indicator showing selected tool (or none)
- Only visible during study phase

### Placing Markers

- Select a tool, click on board to place
- Labels cycle through A, B, C, D... on each placement
- Click an existing marker to remove it

### Storage

- Annotations stored per move position in memory
- Navigating to a different move shows that move's annotations
- Session only - cleared when leaving the game

### Interaction with Board Clicks

- When a tool is selected: click places/removes marker
- When no tool selected: click does nothing (navigation uses buttons)

---

## Implementation Notes

### Files to Modify

**Layout:**
- `src/styles/GameLayout.module.css` - add third column
- `src/components/StudyPhase.jsx` - restructure to 3-column
- `src/components/ReplayPhase.jsx` - restructure, remove modal
- `src/components/CompletionModal.jsx` - convert to panel component

**Difficult Moves:**
- `src/game/GameManager.js` - track wrong attempt positions
- New component for difficult moves list
- Update Board to support review markers

**Annotations:**
- New toolbar component in left panel
- `src/game/GameManager.js` or separate state for annotations per move
- Update Board to render annotation markers

**Mobile:**
- New collapsible bottom panel component
- Update mobile layout styles
