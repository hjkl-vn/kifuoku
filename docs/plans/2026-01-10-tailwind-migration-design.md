# Tailwind CSS Migration Design

## Problem Statement

The current responsive layout has three issues:
1. **Complex breakpoint calculation** - Dynamic JS-based breakpoint calculation in `useBoardSize` is overly complex
2. **Layout breaks at certain sizes** - Components overlap or don't fit properly
3. **Jarring transitions** - Sudden layout switches between mobile and desktop

Additional goals:
- Modernize the design slightly (refined colors, tighter spacing)
- Improve consistency across components via utility classes

## Design Decisions

### Breakpoint Strategy

Replace dynamic JS calculation with standard Tailwind breakpoints:

| Breakpoint | Width | Layout |
|------------|-------|--------|
| Default | <768px | Mobile: stacked, bottom sheet |
| `md` | ≥768px | Tablet: board + collapsible sidebar drawer |
| `lg` | ≥1024px | Desktop: sidebar + board + right panel |

### Layout Structure

**Desktop (lg+):**
```
┌─────────────────────────────────────────────────┐
│ Header                                          │
├──────────┬───────────────────────┬──────────────┤
│ Sidebar  │      Board Area       │ Right Panel  │
│  (20%)   │        (60%)          │    (20%)     │
└──────────┴───────────────────────┴──────────────┘
```

**Tablet (md to lg):**
- Sidebar becomes a slide-out drawer (hamburger toggle)
- Board takes full width
- Right panel content moves to sidebar drawer

**Mobile (<md):**
- Full-width board
- Fixed bottom bar with essential controls (prev/next move)
- Swipe-up bottom sheet containing: game info, move list, settings

### Board Sizing (Hybrid Approach)

- **Keep:** `ResizeObserver` logic for calculating `vertexSize` (precise board fitting)
- **Remove:** `minDesktopWidth` calculation and `isMobileLayout` state
- **Layout decisions:** Move to Tailwind responsive classes (`hidden md:block`, etc.)
- **Simplified hook:** Returns `{ vertexSize, containerRef }` only

### Transition Handling

Instead of jarring switches, use CSS transitions:
- `transition-all duration-300` on containers
- Sidebars slide in/out rather than appearing instantly
- Opacity fades for content that changes between breakpoints

### Component Consolidation

| Current Component | After Migration |
|-------------------|-----------------|
| `Sidebar` | Keep - add drawer behavior for tablet |
| `RightPanel` | Remove - content moves to Sidebar |
| `CollapsibleHeader` | Remove - content moves to BottomSheet |
| `CollapsibleBottomPanel` | Replace with `BottomSheet` |
| `BottomBar` | Keep - simplify for mobile only |
| `GameLayout` | Keep - simplify with Tailwind classes |

**Result:** 6 layout components → 4 components

### Color Palette

Extend Tailwind defaults with semantic names:

```js
colors: {
  primary: '#2196f3',    // blue - actions, selections
  success: '#4caf50',    // green - correct moves, confirm
  error: '#f44336',      // red - wrong moves, errors
  neutral: '#9e9e9e',    // gray - pass button, secondary
  stone: {
    black: '#1a1a1a',
    white: '#f5f5f5',
  }
}
```

### Spacing & Styling Patterns

- Container gap: `gap-5` (20px)
- Component padding: `p-3` to `p-5` (12-20px)
- Border radius: `rounded` to `rounded-lg` (4-8px)
- Transitions: `transition-all duration-200 ease-in-out`

## Migration Approach

**Incremental migration** - Add Tailwind alongside existing CSS modules, migrate component by component, delete CSS modules as each is converted.

Benefits:
- Lower risk, validate as you go
- App stays functional throughout
- Easier to review in smaller commits
