import React, { useRef, useCallback } from 'react'
import styles from '../styles/RangeSlider.module.css'

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
    <div className={styles.container}>
      <div className={styles.track} ref={trackRef}>
        <div
          className={styles.range}
          style={{
            left: `${startPercent}%`,
            width: `${endPercent - startPercent}%`
          }}
        />
        <div
          className={styles.handle}
          style={{ left: `${startPercent}%` }}
          onMouseDown={handleMouseDown('start')}
          onTouchStart={handleMouseDown('start')}
        />
        <div
          className={styles.handle}
          style={{ left: `${endPercent}%` }}
          onMouseDown={handleMouseDown('end')}
          onTouchStart={handleMouseDown('end')}
        />
      </div>
      <div className={styles.labels}>
        <span>Move 1</span>
        <span>Move {max + 1}</span>
      </div>
      <div className={styles.selection}>
        {movesSelected} moves selected ({start + 1}-{end + 1})
      </div>
    </div>
  )
}
