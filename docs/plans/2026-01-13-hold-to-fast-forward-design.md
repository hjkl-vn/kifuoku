# Hold-to-Fast-Forward for Mobile Navigation

## Summary

Add hold-to-repeat behavior to mobile Prev/Next buttons in Study Phase. Users hold a button to step through moves continuously.

## Behavior

1. **Touch** - Fire navigation once immediately
2. **Hold 300ms** - Enter fast-forward mode
3. **Continuous** - Fire every 200ms (~5 moves/second)
4. **Release** - Stop immediately

Quick taps work as before. Hold triggers continuous navigation.

## Implementation

### New Hook: `src/hooks/useHoldToRepeat.js`

```javascript
import { useRef, useCallback } from 'react'

export function useHoldToRepeat(callback, { delay = 300, interval = 200 } = {}) {
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)

  const clear = useCallback(() => {
    clearTimeout(timeoutRef.current)
    clearInterval(intervalRef.current)
  }, [])

  const onTouchStart = useCallback(() => {
    callback()
    timeoutRef.current = setTimeout(() => {
      intervalRef.current = setInterval(callback, interval)
    }, delay)
  }, [callback, delay, interval])

  const onTouchEnd = useCallback(() => {
    clear()
  }, [clear])

  return { onTouchStart, onTouchEnd }
}
```

### Update: `src/components/BottomBar.jsx`

```javascript
const prevHandlers = useHoldToRepeat(onPrev, { delay: 300, interval: 200 })
const nextHandlers = useHoldToRepeat(onNext, { delay: 300, interval: 200 })

<button {...prevHandlers} disabled={!canGoPrev}>◀ Prev</button>
<button {...nextHandlers} disabled={!canGoNext}>Next ▶</button>
```

## Edge Cases

- Disabled buttons: handled by existing `disabled` prop
- Reaching start/end: navigation stops (returns `atStart`/`atEnd`)
- Unmount: clear all timers
- Phase change: component unmounts, timers cleared

## Scope

- Study Phase only (mobile BottomBar)
- Replay Phase unchanged (uses Pass/Confirm buttons)
