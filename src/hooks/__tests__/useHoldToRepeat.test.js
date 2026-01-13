import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/preact'
import { useHoldToRepeat } from '../useHoldToRepeat'
import { HOLD_TO_REPEAT_DELAY_MS, HOLD_TO_REPEAT_INTERVAL_MS } from '../../game/constants'

describe('useHoldToRepeat', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('fires callback immediately on touch start', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onTouchStart()
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('fires callback immediately on mouse down', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onMouseDown()
    })

    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('starts continuous firing after delay', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onTouchStart()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_INTERVAL_MS)
    })
    expect(callback).toHaveBeenCalledTimes(2)

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_INTERVAL_MS)
    })
    expect(callback).toHaveBeenCalledTimes(3)
  })

  it('stops firing on touch end', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onTouchStart()
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS + HOLD_TO_REPEAT_INTERVAL_MS)
    })
    expect(callback).toHaveBeenCalledTimes(2)

    act(() => {
      result.current.onTouchEnd()
    })

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('stops firing on mouse up', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onMouseDown()
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS + HOLD_TO_REPEAT_INTERVAL_MS)
    })

    act(() => {
      result.current.onMouseUp()
    })

    const countAfterStop = callback.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(countAfterStop)
  })

  it('stops firing on mouse leave', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onMouseDown()
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS + HOLD_TO_REPEAT_INTERVAL_MS)
    })

    act(() => {
      result.current.onMouseLeave()
    })

    const countAfterStop = callback.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(countAfterStop)
  })

  it('stops firing on touch cancel', () => {
    const callback = vi.fn()
    const { result } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onTouchStart()
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS + HOLD_TO_REPEAT_INTERVAL_MS)
    })

    act(() => {
      result.current.onTouchCancel()
    })

    const countAfterStop = callback.mock.calls.length

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(countAfterStop)
  })

  it('ignores synthesized mouse event after touch', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onTouchStart()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.onTouchEnd()
    })

    act(() => {
      result.current.onMouseDown()
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('allows mouse event after touch flag is cleared', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onTouchStart()
    })
    act(() => {
      result.current.onTouchEnd()
    })

    act(() => {
      result.current.onMouseDown()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.onMouseUp()
    })

    act(() => {
      result.current.onMouseDown()
    })
    expect(callback).toHaveBeenCalledTimes(2)
  })

  it('prevents double-start while active', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onTouchStart()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.onTouchStart()
    })
    expect(callback).toHaveBeenCalledTimes(1)
  })

  it('cleans up on unmount', () => {
    const callback = vi.fn()
    const { result, unmount } = renderHook(() =>
      useHoldToRepeat(callback, {
        delay: HOLD_TO_REPEAT_DELAY_MS,
        interval: HOLD_TO_REPEAT_INTERVAL_MS
      })
    )

    act(() => {
      result.current.onTouchStart()
    })

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS + HOLD_TO_REPEAT_INTERVAL_MS)
    })
    const countBeforeUnmount = callback.mock.calls.length

    unmount()

    act(() => {
      vi.advanceTimersByTime(1000)
    })
    expect(callback).toHaveBeenCalledTimes(countBeforeUnmount)
  })

  it('uses default delay and interval values', () => {
    const callback = vi.fn()
    const { result } = renderHook(() => useHoldToRepeat(callback))

    act(() => {
      result.current.onTouchStart()
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_DELAY_MS - 1)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(1)
    })
    expect(callback).toHaveBeenCalledTimes(1)

    act(() => {
      vi.advanceTimersByTime(HOLD_TO_REPEAT_INTERVAL_MS)
    })
    expect(callback).toHaveBeenCalledTimes(2)
  })
})
