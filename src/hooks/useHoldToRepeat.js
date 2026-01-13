import { useRef, useCallback, useEffect } from 'react'

export function useHoldToRepeat(callback, { delay = 300, interval = 200 } = {}) {
  const timeoutRef = useRef(null)
  const intervalRef = useRef(null)
  const activeRef = useRef(false)
  const touchUsedRef = useRef(false)

  const clear = useCallback(() => {
    window.clearTimeout(timeoutRef.current)
    window.clearInterval(intervalRef.current)
    activeRef.current = false
  }, [])

  useEffect(() => clear, [clear])

  const start = useCallback(() => {
    if (activeRef.current) return
    activeRef.current = true
    callback()
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(callback, interval)
    }, delay)
  }, [callback, delay, interval])

  const stop = useCallback(() => {
    clear()
  }, [clear])

  const onTouchStart = useCallback(() => {
    touchUsedRef.current = true
    start()
  }, [start])

  const onMouseDown = useCallback(() => {
    if (touchUsedRef.current) {
      touchUsedRef.current = false
      return
    }
    start()
  }, [start])

  return {
    onTouchStart,
    onTouchEnd: stop,
    onTouchCancel: stop,
    onMouseDown,
    onMouseUp: stop,
    onMouseLeave: stop
  }
}
