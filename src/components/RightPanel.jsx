import React, { memo } from 'react'
import ProgressBar from './ProgressBar'
import RangeSlider from './RangeSlider'

export default memo(function RightPanel({
  phase,
  current,
  total,
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
  replaySide,
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex,
  onRestart,
  onGoHome,
  onPass,
  isUserTurn
}) {
  const buttonBase =
    'py-3 px-5 text-base font-bold bg-primary text-white border-none rounded cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed'

  return (
    <aside className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-full md:max-w-[320px]">
      <div className="flex flex-col gap-3">
        <ProgressBar current={current} total={total} />
      </div>

      {phase === 'study' && (
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
      )}

      {phase === 'replay' && stats && (
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
      )}

      {phase === 'complete' && (
        <>
          <div className="bg-gray-100 rounded-lg p-4">
            <div className="flex flex-col items-center py-5 border-b border-gray-300 mb-2.5">
              <span className="text-5xl font-bold text-primary">{stats?.accuracy}%</span>
              <span className="text-sm text-gray-500 uppercase">Accuracy</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-300 last:border-b-0">
              <span>Total time</span>
              <span>{stats?.totalTimeFormatted}s</span>
            </div>
            <div className="flex justify-between py-2">
              <span>Avg per move</span>
              <span>{stats?.avgTimeFormatted}s</span>
            </div>
          </div>

          {difficultMoves && difficultMoves.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold m-0 text-gray-500 uppercase tracking-wide">
                Mistakes
              </h3>
              <ul className="list-none m-0 p-0 flex flex-col gap-2">
                {difficultMoves.map((move) => (
                  <li key={move.moveIndex}>
                    <button
                      className={[
                        'flex justify-between items-center w-full py-3 px-4 bg-white border border-gray-300 rounded-lg cursor-pointer text-sm transition-all duration-150 hover:bg-gray-100 hover:border-primary',
                        selectedMoveIndex === move.moveIndex ? 'bg-blue-50 border-primary' : ''
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      onClick={() => onSelectDifficultMove(move)}
                    >
                      <span>Move {move.moveIndex + 1}</span>
                      <span className="bg-red-50 text-red-800 py-1 px-2 rounded text-xs font-medium">
                        {move.attemptCount} {move.attemptCount === 1 ? 'attempt' : 'attempts'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-auto">
            <button className={buttonBase} onClick={onRestart}>
              Play Again
            </button>
            <button
              className="py-4 px-8 text-lg font-bold bg-success text-white border-none rounded cursor-pointer"
              onClick={onGoHome}
            >
              New Game
            </button>
          </div>
        </>
      )}
    </aside>
  )
})
