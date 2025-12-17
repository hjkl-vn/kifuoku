# Responsive Layout Design

## Overview

Redesign the game page from 3-column to 2-column layout, with responsive mobile support. The Go board is the primary focus; all other UI is secondary.

## Desktop Layout (≥768px)

**Structure: Left Sidebar (280px fixed) + Board Area (flexible)**

```
┌──────────────────┬─────────────────────────────────────┐
│                  │       ████████░░░░  45/120          │
│    GameInfo      ├─────────────────────────────────────┤
│  ┌────────────┐  │                                     │
│  │Black: Name │  │                                     │
│  │White: Name │  │                                     │
│  │Date, Result│  │                                     │
│  └────────────┘  │            Go Board                 │
│                  │                                     │
│   Navigation     │                                     │
│  [◀ Prev][Next▶] │                                     │
│                  │                                     │
│  ─────────────── │                                     │
│  Range: 1-120    │                                     │
│  ○───────────●   │                                     │
│  [Start Replay]  │                                     │
│                  │                                     │
│  (Replay only)   │                                     │
│     Stats        │                                     │
│  ┌────────────┐  │                                     │
│  │Correct: 12 │  │                                     │
│  │Wrong: 3    │  │                                     │
│  └────────────┘  │                                     │
└──────────────────┴─────────────────────────────────────┘
```

### Sidebar Components

1. **GameInfo** - Player names, ranks, date, result
2. **Navigation** - Prev/Next buttons only (no move text, progress bar shows this)
3. **Range Slider + Start Replay** - Always visible in Study phase (allows skipping ahead)
4. **Stats** - Replay phase only (correct/wrong counts)

### Board Area

- Progress bar spans board width, includes move count inside (e.g., "45/120")
- Board fills remaining space, maintains square aspect ratio
- Board centered vertically in available space

## Mobile Layout (<768px)

**Structure: Collapsible Header + Board + Fixed Bottom Bar**

### Collapsed State (Default)

```
┌────────────────────────────┐
│ ▼ Black vs White      45/120│
├────────────────────────────┤
│    ████████░░░░░░░░░░      │
├────────────────────────────┤
│                            │
│         Go Board           │
│         (stable)           │
│                            │
├────────────────────────────┤
│    [◀ Prev]   [Next ▶]     │
└────────────────────────────┘
```

### Expanded State (Overlay)

```
┌────────────────────────────┐
│ ▲ Black vs White           │
│   Black: Name (rank)       │
│   White: Name (rank)       │
│   Date, Result             │
│ ─────────────────────────  │
│   Range: ○───────────●     │
│   [Start Replay]           │
│ ─────────────────────────  │
│   Correct: 12  Wrong: 3    │
├────────────────────────────┤
│    ████████░░░░░░░░░ 45/120│
├────────────────────────────┤
│         Go Board           │
│    [◀ Prev]   [Next ▶]     │
└────────────────────────────┘
```

### Mobile Behavior

- Header collapsed by default to maximize board space
- Expanded header **overlays** the board (board position stays fixed)
- Encourages users to close header and focus on the board
- Tapping ▲ or outside the header collapses it
- Bottom bar with Prev/Next always visible

## Responsive Breakpoint

| Width | Layout |
|-------|--------|
| ≥768px | Desktop (sidebar + board) |
| <768px | Mobile (collapsible header + bottom bar) |

Rationale:
- Tablets in landscape → Desktop layout
- Tablets in portrait → Mobile layout
- Phones → Mobile layout

## Key UX Principles

1. **Board is the star** - Maximize board space in all layouts
2. **Controls always accessible** - Sidebar on desktop, bottom bar on mobile
3. **Reduce distraction** - Secondary info (stats, game details) tucked away on mobile
4. **Stable layout** - Board doesn't shift when mobile header expands

## Implementation Notes

- Remove the current rightPanel entirely
- Merge rightPanel content into leftPanel (desktop) / collapsible header (mobile)
- Progress bar component needs update to include move count inside
- New mobile-specific components: CollapsibleHeader, BottomBar
- CSS media query at 768px for layout switch
