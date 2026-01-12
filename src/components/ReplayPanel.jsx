import React, { memo } from 'react'

export default memo(function ReplayPanel({ replaySide, stats, onPass, isUserTurn }) {
  return (
    <>
      {replaySide && (
        <div className="text-base font-semibold text-center p-3 bg-blue-50 rounded-lg text-blue-800">
          Playing as {replaySide === 'B' ? 'Black' : 'White'}
        </div>
      )}
      <div className="flex flex-col gap-3">
        <button
          type="button"
          className="w-full py-3 px-5 text-base font-bold bg-neutral text-white border-none rounded-lg cursor-pointer hover:not-disabled:bg-gray-500 active:not-disabled:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          onClick={onPass}
          disabled={!isUserTurn}
        >
          Pass
        </button>
      </div>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex justify-between py-2 border-b border-gray-300 last:border-b-0">
          <span>Correct (1st try)</span>
          <span>{stats.correctFirstTry}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-300 last:border-b-0">
          <span>Wrong attempts</span>
          <span>{stats.wrongMoveCount}</span>
        </div>
      </div>
    </>
  )
})
