import React, { memo } from 'react'
import ProgressBar from './ProgressBar'
import StudyPanel from './StudyPanel'
import ReplayPanel from './ReplayPanel'
import CompletePanel from './CompletePanel'

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
