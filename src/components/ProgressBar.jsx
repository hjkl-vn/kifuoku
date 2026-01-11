import React from 'react'

export default function ProgressBar({ current, total, replaySide }) {
  const percentage = total > 0 ? (current / total) * 100 : 0
  const sideLabel = replaySide === 'B' ? 'Black' : replaySide === 'W' ? 'White' : null

  return (
    <div className="w-full">
      <div className="relative w-full h-7 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-primary transition-[width] duration-300 ease-out"
          style={{ width: `${percentage}%` }}
        />
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-sm font-bold text-gray-800 [text-shadow:0_0_2px_rgba(255,255,255,0.8)]">
          {current} / {total}
          {sideLabel && ` • Playing as ${sideLabel}`}
        </span>
      </div>
    </div>
  )
}
