import React, { useEffect, useState } from 'react'
import Board from './Board'
import ProgressBar from './ProgressBar'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/board-utils'
import layout from '../styles/gameLayout.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0

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

  return (
    <div className={layout.container}>
      <CollapsibleHeader
        gameInfo={gameInfo}
        phase="study"
        current={state.studyPosition}
        total={state.totalMoves}
        totalMoves={state.totalMoves}
        rangeStart={rangeStart}
        rangeEnd={rangeEnd}
        onRangeChange={handleRangeChange}
        onStartReplay={handleStartReplay}
      />

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
      />

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.progressBarWrapper}>
            <ProgressBar current={state.studyPosition} total={state.totalMoves} />
          </div>
          <div className={layout.boardContainer}>
            <Board signMap={board.signMap} markerMap={markerMap} />
          </div>
        </div>
      </div>

      <BottomBar
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={() => gameManager.studyPrev()}
        onNext={() => gameManager.studyNext()}
      />
    </div>
  )
}
