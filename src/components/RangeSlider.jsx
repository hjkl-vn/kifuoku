import React, { useRef, useCallback } from 'react'

export default function RangeSlider({ min, max, start, end, onChange }) {
  const trackRef = useRef(null)

  const getPositionFromEvent = useCallback(
    (e) => {
      const track = trackRef.current
      if (!track) return null

      const rect = track.getBoundingClientRect()
      const clientX = e.touches ? e.touches[0].clientX : e.clientX
      const percent = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      return Math.round(min + percent * (max - min))
    },
    [min, max]
  )

  const handleMouseDown = useCallback(
    (handle) => (e) => {
      e.preventDefault()

      const onMove = (moveEvent) => {
        const pos = getPositionFromEvent(moveEvent)
        if (pos === null) return

        if (handle === 'start') {
          const newStart = Math.min(pos, end - 1)
          onChange(Math.max(min, newStart), end)
        } else {
          const newEnd = Math.max(pos, start + 1)
          onChange(start, Math.min(max, newEnd))
        }
      }

      const onUp = () => {
        document.removeEventListener('mousemove', onMove)
        document.removeEventListener('mouseup', onUp)
        document.removeEventListener('touchmove', onMove)
        document.removeEventListener('touchend', onUp)
      }

      document.addEventListener('mousemove', onMove)
      document.addEventListener('mouseup', onUp)
      document.addEventListener('touchmove', onMove)
      document.addEventListener('touchend', onUp)
    },
    [getPositionFromEvent, start, end, min, max, onChange]
  )

  const range = max - min || 1
  const startPercent = ((start - min) / range) * 100
  const endPercent = ((end - min) / range) * 100

  const movesSelected = end - start + 1

  return (
    <div className="w-full py-2.5">
      <div className="relative h-3 bg-gray-300 rounded-md cursor-pointer" ref={trackRef}>
        <div
          className="absolute h-full bg-primary rounded-md"
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`
          }}
        />
        <div
          className="absolute top-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none hover:bg-blue-50 active:cursor-grabbing active:bg-blue-100"
          style={{ left: `${startPercent}%` }}
          onMouseDown={handleMouseDown('start')}
          onTouchStart={handleMouseDown('start')}
        />
        <div
          className="absolute top-1/2 w-5 h-5 bg-white border-2 border-primary rounded-full -translate-x-1/2 -translate-y-1/2 cursor-grab touch-none hover:bg-blue-50 active:cursor-grabbing active:bg-blue-100"
          style={{ left: `${endPercent}%` }}
          onMouseDown={handleMouseDown('end')}
          onTouchStart={handleMouseDown('end')}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        <span>Move 1</span>
        <span>Move {max + 1}</span>
      </div>
      <div className="text-center mt-3 text-sm font-medium text-gray-800">
        {movesSelected} moves selected ({start + 1}-{end + 1})
      </div>
    </div>
  )
}
