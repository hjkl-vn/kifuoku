# Responsive Board Sizing Design

## Problem

The Go board has a fixed `vertexSize={34}`, making a 19x19 board roughly 646px wide. On mobile phones (~375px), this overflows significantly.

## Solution

A `useBoardSize` hook that dynamically calculates `vertexSize` based on available container space, constrained by a maximum size.

## Design Decisions

- **Sizing strategy:** Fit within bounds with maximum size (not breakpoint-based)
- **Implementation:** ResizeObserver-based hook measuring container dimensions
- **Maximum vertex size:** 40px (slightly larger than current 34px)
- **Mobile padding:** 16px (unchanged)
- **Square constraint:** Use minimum of available width and height since board is square

## Hook Implementation

**File:** `src/hooks/useBoardSize.js`

```javascript
import { useState, useEffect, useRef } from 'react'

const COORDINATE_LABEL_SPACE = 48  // ~24px each side for Shudan labels

export function useBoardSize({
  boardSize,
  maxVertexSize = 40
}) {
  const containerRef = useRef(null)
  const [vertexSize, setVertexSize] = useState(maxVertexSize)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateSize = () => {
      const availableWidth = container.clientWidth - COORDINATE_LABEL_SPACE
      const availableHeight = container.clientHeight - COORDINATE_LABEL_SPACE

      const fromWidth = Math.floor(availableWidth / boardSize)
      const fromHeight = Math.floor(availableHeight / boardSize)

      const calculated = Math.min(fromWidth, fromHeight)
      setVertexSize(Math.min(maxVertexSize, calculated))
    }

    const observer = new ResizeObserver(calculateSize)
    observer.observe(container)
    calculateSize()

    return () => observer.disconnect()
  }, [boardSize, maxVertexSize])

  return { containerRef, vertexSize }
}
```

**API:**
```javascript
const { containerRef, vertexSize } = useBoardSize({
  boardSize: 19,      // grid dimensions
  maxVertexSize: 40   // cap for large screens
})
```

## Component Changes

### Board.jsx

Accept `vertexSize` as a prop instead of hardcoding:

```jsx
export default function Board({
  signMap, markerMap, paintMap, onVertexClick,
  vertexSize = 34
}) {
  return (
    <Goban
      vertexSize={vertexSize}
      // ... other props unchanged
    />
  )
}
```

### Parent Components (StudyPhase, ReplayPhase)

Use the hook and pass `vertexSize` to Board:

```jsx
function StudyPhase({ gameManager, ... }) {
  const { containerRef, vertexSize } = useBoardSize({
    boardSize: gameManager.boardSize,
    maxVertexSize: 40
  })

  return (
    <div className={styles.boardContainer} ref={containerRef}>
      <Board vertexSize={vertexSize} ... />
    </div>
  )
}
```

## CSS Changes

### GameLayout.module.css

```css
.boardContainer {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

.boardArea {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;  /* allows flex child to shrink below content size */
}
```

## Files to Modify

1. **Create:** `src/hooks/useBoardSize.js`
2. **Edit:** `src/components/Board.jsx` - accept vertexSize prop
3. **Edit:** `src/components/StudyPhase.jsx` - use hook, pass vertexSize
4. **Edit:** `src/components/ReplayPhase.jsx` - use hook, pass vertexSize
5. **Edit:** `src/styles/GameLayout.module.css` - container sizing

## Notes

- The 48px coordinate label space is an estimate; may need tuning based on actual Shudan rendering
- `Math.floor` prevents sub-pixel rendering issues
- Initial state uses `maxVertexSize` to avoid layout shift on large screens
- ResizeObserver handles orientation changes, window resizes, and sidebar toggles
