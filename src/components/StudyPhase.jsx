import React, { useEffect, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/board-utils'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0
  const currentTurn = gameManager.getCurrentTurn()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (canGoNext) gameManager.studyNext()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (canGoPrev) gameManager.studyPrev()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canGoNext, canGoPrev, gameManager])

  const markerMap = lastMove ? createEmptyBoardMap(state.boardSize) : null
  if (markerMap && lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  const handleRangeChange = (start, end) => {
    setRangeStart(start)
    setRangeEnd(end)
  }

  const handleStartReplay = () => {
    gameManager.startReplay(rangeStart, rangeEnd)
  }

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="study"
          totalMoves={state.totalMoves}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeChange={handleRangeChange}
          onStartReplay={handleStartReplay}
          currentTurn={currentTurn}
        />
      )}

      {!isMobileLayout && (
        <Sidebar
          gameInfo={gameInfo}
          phase="study"
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          totalMoves={state.totalMoves}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onRangeChange={handleRangeChange}
          onStartReplay={handleStartReplay}
          current={state.studyPosition}
          total={state.totalMoves}
          currentTurn={currentTurn}
        />
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.boardContainer} ref={containerRef}>
            <Board signMap={board.signMap} markerMap={markerMap} vertexSize={vertexSize} />
          </div>
        </div>
      </div>

      {isMobileLayout && (
        <BottomBar
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          current={state.studyPosition}
          total={state.totalMoves}
        />
      )}
    </div>
  )
}
