# Ghost Stone Hover Preview

Display ghost stones and annotation markers on hover to improve clarity and prevent misclicks.

## Scope

Desktop only. Mobile and collapsed layouts remain unchanged.

### Behavior by Context

| Context | Hover Effect |
|---------|--------------|
| Replay phase (user's turn) | Semi-transparent stone in current player's color |
| Study phase (annotation selected) | Preview of selected annotation marker |
| Study phase (no tool selected) | None |
| Occupied intersection | None |
| Game complete | None |

## Implementation

### Board.jsx

Add two props and forward them to Shudan's Goban:
- `onVertexMouseEnter(evt, vertex)`
- `onVertexMouseLeave()`

Board remains a thin wrapper with no internal hover state.

### ReplayPhase.jsx

Track `hoverVertex` state. On mouse enter, validate the position:
- Intersection must be empty
- Must be user's turn
- Game must not be complete

Build `ghostStoneMap` from hover position and current player's sign (+1 black, -1 white). Pending move takes precedence over hover preview.

### StudyPhase.jsx

Track `hoverVertex` state. Show preview marker based on `selectedTool`:
- Circle, triangle, cross, or label marker
- Merge into `markerMap` with reduced opacity styling

### Board.module.css

Apply hover styles only to devices with fine pointer input:

```css
@media (hover: hover) and (pointer: fine) {
  /* hover preview styles */
}
```

Style hover markers via `.shudan-vertex .shudan-marker` selectors.

## Edge Cases

| Scenario | Behavior |
|----------|----------|
| Mouse leaves board | Clear hoverVertex |
| Hover over occupied intersection | No ghost shown |
| Hover during opponent's turn | No ghost shown |
| Hover while game complete | No ghost shown |
| Hover same vertex as pending move | Pending move takes precedence |

## Testing

Manual verification:
- Hover appears only on valid empty intersections
- No hover effects on touch devices (test via DevTools emulation)
- Annotation preview shows all 4 tool types correctly

No unit tests required. This feature adds no business logic.
