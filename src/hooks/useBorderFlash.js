import { useState, useCallback, useRef, useEffect } from 'react'
import { BORDER_FLASH_DURATION_MS } from '../game/constants'

export function useBorderFlash(durationMs = BORDER_FLASH_DURATION_MS) {
  const [flash, setFlash] = useState(null)
  const timeoutRef = useRef(null)

  const triggerFlash = useCallback(
    (type) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      setFlash(type)
      timeoutRef.current = setTimeout(() => setFlash(null), durationMs)
    },
    [durationMs]
  )

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return [flash, triggerFlash]
}
