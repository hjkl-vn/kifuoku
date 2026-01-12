import React, { memo } from 'react'
import RangeSlider from './RangeSlider'

export default memo(function StudyPanel({
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  rangeStart,
  rangeEnd,
  totalMoves,
  onRangeChange,
  onStartReplay,
  gameInfo,
  oneColorMode,
  onOneColorModeChange
}) {
  const buttonBase =
    'py-3 px-5 text-base font-bold bg-primary text-white border-none rounded cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed'

  return (
    <>
      <div className="flex flex-col gap-3">
        <div className="flex gap-2.5">
          <button className={`${buttonBase} flex-1`} onClick={onPrev} disabled={!canGoPrev}>
            Prev
          </button>
          <button className={`${buttonBase} flex-1`} onClick={onNext} disabled={!canGoNext}>
            Next
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <RangeSlider
          min={0}
          max={totalMoves - 1}
          start={rangeStart}
          end={rangeEnd}
          onChange={onRangeChange}
        />
        <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
          <input
            type="checkbox"
            checked={oneColorMode}
            onChange={(e) => onOneColorModeChange(e.target.checked)}
            className="w-4 h-4 accent-primary cursor-pointer"
          />
          One-color go
        </label>
        <div className="flex flex-col gap-2">
          <button
            className="py-4 px-8 text-lg font-bold bg-success text-white border-none rounded cursor-pointer"
            onClick={() => onStartReplay()}
          >
            Replay All
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-black text-white border-none rounded cursor-pointer hover:bg-gray-800"
            onClick={() => onStartReplay('B')}
          >
            Replay as {gameInfo?.blackPlayer || 'Black'}
          </button>
          <button
            className="py-3 px-5 text-base font-bold bg-stone-white text-stone-black border-2 border-stone-black rounded cursor-pointer hover:bg-gray-200"
            onClick={() => onStartReplay('W')}
          >
            Replay as {gameInfo?.whitePlayer || 'White'}
          </button>
        </div>
      </div>
    </>
  )
})
