# Study Phase Component Grouping Design

## Problem

The current study phase UI has related controls scattered across different areas:

- **Study tools split apart**: Annotation toolbar is in the left sidebar while navigation (Prev/Next) is in the right panel
- **Replay config mixed with actions**: Range slider and one-color checkbox are sandwiched between navigation and replay buttons with no visual separation
- **Mobile layout mixes concerns**: Top collapsible panel combines Game Info with replay configuration

## Design Principles

1. **Group by purpose**: Controls that serve the same function should be visually grouped
2. **Match task flow**: Layout should follow the natural workflow (study → configure → replay)
3. **Consistent separation**: Same logical groups on both desktop and mobile

## Logical Groups

| Group | Controls | Purpose |
|-------|----------|---------|
| **Context** | Game Info, Progress Bar | "What am I looking at?" |
| **Study Tools** | Prev/Next, Annotation Toolbar | "Navigate & mark up the game" |
| **Replay Setup** | Range Slider, One-color checkbox, Replay buttons | "Configure and start replay" |

## Desktop Layout

### Left Sidebar
- Game Info only (static reference)

### Right Panel (top to bottom)

```
┌─────────────────────────────┐
│ PROGRESS BAR                │  ← Position indicator
├─────────────────────────────┤
│ ◀ Prev    Next ▶           │  ┐
│ △ □ ○ ✕ A                  │  │ Study Tools
│ (annotation toolbar)        │  ┘
├─────────────────────────────┤
│ Range: [====●────●====]     │  ┐
│ ☐ One-color go              │  │
├─────────────────────────────┤  │ Replay Setup
│ [ Replay All ]              │  │
│ [ Replay as Black ]         │  │
│ [ Replay as White ]         │  ┘
└─────────────────────────────┘
```

Visual separators (spacing or light borders) between the three sections.

## Mobile Layout

### Top Collapsible Panel
- Game Info only
- Collapsed state shows player summary
- Expanded shows full game details

### Center
- Board (maximized)

### Fixed Bottom Bar
- Compact progress indicator
- Prev/Next navigation buttons
- Annotation tool icons

### Bottom Collapsible Panel (expands upward)
- Collapsed label: "Start Replay"
- Expanded content:
  - Range slider
  - One-color go checkbox
  - Replay buttons (Replay All, Replay as Black, Replay as White)

```
┌─────────────────────────────┐
│ ▼ Game Info                 │  ← Top panel (context)
└─────────────────────────────┘
┌─────────────────────────────┐
│         BOARD               │
└─────────────────────────────┘
┌─────────────────────────────┐
│ ◀ Prev [progress] Next ▶   │  ← Fixed bottom bar
│ △ □ ○ ✕ A                  │
├─────────────────────────────┤
│ ▲ Start Replay              │  ← Bottom panel (replay)
│   Range: [●────●]           │
│   ☐ One-color go            │
│   [Replay All] [Black] [Wh] │
└─────────────────────────────┘
```

## Changes Required

### Desktop

1. **Move AnnotationToolbar** from `Sidebar` to `RightPanel`/`StudyPanel`
2. **Update StudyPanel** to include annotations below navigation
3. **Add visual separators** between Progress, Study Tools, and Replay Setup sections
4. **Simplify Sidebar** to only render GameInfo

### Mobile

1. **Update top CollapsiblePanel** to only contain GameInfo (remove replay controls)
2. **Create bottom CollapsiblePanel** for replay setup
3. **Keep BottomBar** with nav + annotations (already correct)
4. **Add compact progress indicator** to BottomBar

### Component Changes

| Component | Change |
|-----------|--------|
| `Sidebar.jsx` | Remove children prop, render GameInfo only |
| `StudyPanel.jsx` | Add AnnotationToolbar, add section separators |
| `StudyPhase.jsx` | Update mobile layout with two collapsible panels |
| `BottomBar.jsx` | Add compact progress indicator |
| `RightPanel.jsx` | Pass annotation props to StudyPanel |
