# Progressive Subdivision Hints Design

## Summary

Replace the current 3-tier hint system (quadrant → A/B/C/D multiple choice → exact point) with a binary-search style progressive subdivision approach. Each wrong attempt highlights a smaller region until the area is ~3×3, then shows the exact point.

**Problem:** Current A/B/C/D hints always have "A" as the correct answer since options aren't randomized.

**Solution:** Remove multiple choice entirely. Use consistent subdivision mechanic that progressively narrows down the search area.

## Hint Progression

1. **First wrong attempt:** Highlight the quadrant containing the correct move (~10×10 on 19×19 board)
2. **Second wrong attempt:** Subdivide to sub-quadrant (~5×5)
3. **Third wrong attempt:** Subdivide again (~3×3)
4. **Fourth wrong attempt:** Show exact point with triangle marker

Each highlight replaces the previous one (no nested highlighting).

## Data Structures

### New State in GameManager

```javascript
this.currentHintRegion = null  // { minX, maxX, minY, maxY }
```

### Constants Changes

**Remove:**
- `GHOST_HINT_COUNT`
- `GHOST_HINT_RADIUS`
- `MAX_GHOST_GENERATION_ATTEMPTS`
- `HINT_LETTERS`

**Update HINT_TYPES:**
```javascript
export const HINT_TYPES = {
  QUADRANT: 'quadrant',  // Used for all subdivision levels
  EXACT: 'exact'         // Renamed from TRIANGLE
}
```

### Stats Changes

**Remove:**
- `ghostHintsUsed`

**Add:**
- `subdivisionHintsUsed` (tracks total subdivisions shown)

## GameManager Changes

### Remove

- `currentGhostStones` array
- `generateGhostStones()` method
- `handleGhostClick()` method
- `isValidHintPosition()` method

### Add Helper Functions

**`getQuadrantBounds(move, boardSize)`**
```javascript
const midX = Math.floor(boardSize / 2)
const midY = Math.floor(boardSize / 2)
return {
  minX: move.x < midX ? 0 : midX,
  maxX: move.x < midX ? midX - 1 : boardSize - 1,
  minY: move.y < midY ? 0 : midY,
  maxY: move.y < midY ? midY - 1 : boardSize - 1
}
```

**`getSubQuadrant(region, move)`**
```javascript
const midX = Math.floor((region.minX + region.maxX) / 2)
const midY = Math.floor((region.minY + region.maxY) / 2)
return {
  minX: move.x <= midX ? region.minX : midX + 1,
  maxX: move.x <= midX ? midX : region.maxX,
  minY: move.y <= midY ? region.minY : midY + 1,
  maxY: move.y <= midY ? midY : region.maxY
}
```

**`isRegionSmallEnough(region)`**
```javascript
const width = region.maxX - region.minX + 1
const height = region.maxY - region.minY + 1
return width <= 3 && height <= 3
```

### Updated validateMove() Flow

```javascript
wrongAttemptsCurrentMove++

if (wrongAttemptsCurrentMove === 1) {
  // First wrong: full quadrant
  this.currentHintRegion = getQuadrantBounds(correctMove, this.boardSize)
  this.stats.quadrantHintsUsed++
  return { hintType: 'quadrant', region: this.currentHintRegion }
}

if (isRegionSmallEnough(this.currentHintRegion)) {
  // Region ≤ 3×3: show exact point
  this.stats.exactHintsUsed++
  return { hintType: 'exact', position: { x: correctMove.x, y: correctMove.y } }
}

// Otherwise: subdivide current region
this.currentHintRegion = getSubQuadrant(this.currentHintRegion, correctMove)
this.stats.subdivisionHintsUsed++
return { hintType: 'quadrant', region: this.currentHintRegion }
```

### Reset Logic

When user gets the move correct or moves to next move:
- `currentHintRegion = null`
- `wrongAttemptsCurrentMove = 0`

## ReplayPhase.jsx Changes

### Remove

- `eliminatedLetters` state
- Ghost stone click handling in `handleVertexClick`
- Ghost stone marker rendering (HINT_LETTERS loop)

### Simplified Hint Rendering

```jsx
// Quadrant and all subdivisions use paintMap
if (hintState?.hintType === 'quadrant' && hintState.region) {
  const { minX, maxX, minY, maxY } = hintState.region
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      paintMap[y][x] = 1
    }
  }
}

// Exact point uses triangle marker
if (hintState?.hintType === 'exact' && hintState.position) {
  const { x, y } = hintState.position
  markerMap[y][x] = { type: 'triangle' }
}
```

## Files to Modify

1. `src/game/constants.js` - Remove ghost constants, update HINT_TYPES
2. `src/game/GameManager.js` - Remove ghost methods, add subdivision logic
3. `src/components/ReplayPhase.jsx` - Simplify hint rendering
4. `src/game/__tests__/GameManager.test.js` - Update tests for new hint system
