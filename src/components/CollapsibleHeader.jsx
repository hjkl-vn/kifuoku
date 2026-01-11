import React, { useState } from 'react'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'

export default function CollapsibleHeader({
  gameInfo,
  phase,
  totalMoves,
  rangeStart,
  rangeEnd,
  onRangeChange,
  onStartReplay,
  stats,
  currentTurn
}) {
  const [isExpanded, setIsExpanded] = useState(false)

  const playerSummary = gameInfo
    ? `${gameInfo.blackPlayer || 'Black'} ⚫ vs ${gameInfo.whitePlayer || 'White'} ⚪`
    : 'Game'

  return (
    <div className="block relative">
      <button
        className={[
          'flex items-center w-full py-3 px-4 bg-gray-100 border-none cursor-pointer text-sm hover:bg-gray-200',
          isExpanded ? 'border-b border-gray-300' : 'border-b-2 border-primary'
        ].join(' ')}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <span className="mr-2.5 text-lg text-primary">{isExpanded ? '▲' : '▼'}</span>
        <span className="flex-1 text-left font-medium">{playerSummary}</span>
      </button>

      {isExpanded && (
        <>
          <div className="fixed inset-0 bg-black/30 z-10" onClick={() => setIsExpanded(false)} />
          <div className="absolute top-full left-0 right-0 bg-white border-b border-gray-300 p-4 z-[11] shadow-lg flex flex-col gap-4">
            <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />

            {phase === 'study' && (
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
                    onClick={() => {
                      onStartReplay()
                      setIsExpanded(false)
                    }}
                  >
                    Replay All
                  </button>
                  <button
                    className="py-3 px-5 text-base font-bold bg-stone-black text-white border-none rounded cursor-pointer hover:bg-gray-800"
                    onClick={() => {
                      onStartReplay('B')
                      setIsExpanded(false)
                    }}
                  >
                    Replay as {gameInfo?.blackPlayer || 'Black'}
                  </button>
                  <button
                    className="py-3 px-5 text-base font-bold bg-stone-white text-stone-black border-2 border-stone-black rounded cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      onStartReplay('W')
                      setIsExpanded(false)
                    }}
                  >
                    Replay as {gameInfo?.whitePlayer || 'White'}
                  </button>
                </div>
              </div>
            )}

            {phase === 'replay' && stats && (
              <div className="bg-gray-100 rounded-lg p-3">
                <div className="flex justify-between py-1.5 text-sm">
                  <span>Correct (1st try)</span>
                  <span>{stats.correctFirstTry}</span>
                </div>
                <div className="flex justify-between py-1.5 text-sm">
                  <span>Wrong attempts</span>
                  <span>{stats.wrongMoveCount}</span>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
