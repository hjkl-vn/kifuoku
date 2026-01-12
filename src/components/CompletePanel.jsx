import React, { memo } from 'react'
import PropTypes from 'prop-types'

const CompletePanel = memo(function CompletePanel({
  stats,
  difficultMoves,
  onSelectDifficultMove,
  selectedMoveIndex,
  onRestart,
  onGoHome
}) {
  const buttonBase =
    'py-3 px-5 text-base font-bold bg-primary text-white border-none rounded cursor-pointer disabled:bg-gray-300 disabled:cursor-not-allowed'

  return (
    <>
      <div className="bg-gray-100 rounded-lg p-4">
        <div className="flex flex-col items-center py-5 border-b border-gray-300 mb-2.5">
          <span className="text-5xl font-bold text-primary">{stats?.accuracy}%</span>
          <span className="text-sm text-gray-500 uppercase">Accuracy</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-300 last:border-b-0">
          <span>Total time</span>
          <span>{stats?.totalTimeFormatted}</span>
        </div>
        <div className="flex justify-between py-2">
          <span>Avg per move</span>
          <span>{stats?.avgTimeFormatted}</span>
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
  )
})

CompletePanel.propTypes = {
  stats: PropTypes.shape({
    accuracy: PropTypes.number,
    totalTimeFormatted: PropTypes.string,
    avgTimeFormatted: PropTypes.string
  }),
  difficultMoves: PropTypes.arrayOf(
    PropTypes.shape({
      moveIndex: PropTypes.number.isRequired,
      attemptCount: PropTypes.number.isRequired
    })
  ),
  onSelectDifficultMove: PropTypes.func.isRequired,
  selectedMoveIndex: PropTypes.number,
  onRestart: PropTypes.func.isRequired,
  onGoHome: PropTypes.func.isRequired
}

export default CompletePanel
