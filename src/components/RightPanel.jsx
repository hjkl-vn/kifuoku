import React, { memo } from 'react'
import PropTypes from 'prop-types'
import ProgressBar from './ProgressBar'
import StudyPanel from './StudyPanel'
import ReplayPanel from './ReplayPanel'
import CompletePanel from './CompletePanel'

const RightPanel = memo(function RightPanel({
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
  isUserTurn,
  oneColorMode,
  onOneColorModeChange
}) {
  return (
    <aside className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-full md:max-w-[320px]">
      <div className="flex flex-col gap-3">
        <ProgressBar current={current} total={total} />
      </div>

      {phase === 'study' && (
        <StudyPanel
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={onPrev}
          onNext={onNext}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalMoves={totalMoves}
          onRangeChange={onRangeChange}
          onStartReplay={onStartReplay}
          gameInfo={gameInfo}
          oneColorMode={oneColorMode}
          onOneColorModeChange={onOneColorModeChange}
        />
      )}

      {phase === 'replay' && stats && (
        <ReplayPanel
          replaySide={replaySide}
          stats={stats}
          onPass={onPass}
          isUserTurn={isUserTurn}
        />
      )}

      {phase === 'complete' && (
        <CompletePanel
          stats={stats}
          difficultMoves={difficultMoves}
          onSelectDifficultMove={onSelectDifficultMove}
          selectedMoveIndex={selectedMoveIndex}
          onRestart={onRestart}
          onGoHome={onGoHome}
        />
      )}
    </aside>
  )
})

RightPanel.propTypes = {
  phase: PropTypes.oneOf(['study', 'replay', 'complete']).isRequired,
  current: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  canGoPrev: PropTypes.bool,
  canGoNext: PropTypes.bool,
  onPrev: PropTypes.func,
  onNext: PropTypes.func,
  rangeStart: PropTypes.number,
  rangeEnd: PropTypes.number,
  totalMoves: PropTypes.number,
  onRangeChange: PropTypes.func,
  onStartReplay: PropTypes.func,
  gameInfo: PropTypes.object,
  replaySide: PropTypes.oneOf(['B', 'W', null]),
  stats: PropTypes.object,
  difficultMoves: PropTypes.array,
  onSelectDifficultMove: PropTypes.func,
  selectedMoveIndex: PropTypes.number,
  onRestart: PropTypes.func,
  onGoHome: PropTypes.func,
  onPass: PropTypes.func,
  isUserTurn: PropTypes.bool,
  oneColorMode: PropTypes.bool,
  onOneColorModeChange: PropTypes.func
}

export default RightPanel
