import React, { useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import BottomBar from './BottomBar'
import CompletionModal from './CompletionModal'
import { createEmptyBoardMap } from '../game/board-utils'
import { BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'
import replayStyles from '../styles/ReplayPhase.module.css'

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [borderFlash, setBorderFlash] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    } else if (result.needHint) {
      setHintState(result)
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    }
  }

  const markerMap = createEmptyBoardMap(state.boardSize)
  const paintMap = createEmptyBoardMap(state.boardSize)

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  if (hintState?.hintType === 'quadrant' && hintState.region) {
    const { minX, maxX, minY, maxY } = hintState.region
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        paintMap[y][x] = 1
      }
    }
  }

  if (hintState?.hintType === 'exact' && hintState.position) {
    const { x, y } = hintState.position
    markerMap[y][x] = { type: 'triangle' }
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? replayStyles.borderSuccess : '',
    borderFlash === 'error' ? replayStyles.borderError : ''
  ].filter(Boolean).join(' ')

  const stats = {
    correctFirstTry: state.stats.correctFirstTry,
    wrongMoveCount: state.stats.wrongMoveCount
  }

  const containerClass = [
    layout.container,
    isMobileLayout ? layout.mobileLayout : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="replay"
          current={state.replayPosition}
          total={state.totalMoves}
          stats={stats}
        />
      )}

      {!isMobileLayout && (
        <Sidebar
          gameInfo={gameInfo}
          phase="replay"
          canGoPrev={false}
          canGoNext={false}
          stats={stats}
          current={state.replayPosition}
          total={state.totalMoves}
        />
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={boardContainerClass} ref={containerRef}>
            <Board
              signMap={board.signMap}
              markerMap={markerMap}
              paintMap={paintMap}
              onVertexClick={handleVertexClick}
              vertexSize={vertexSize}
            />
          </div>
        </div>
      </div>

      {isMobileLayout && (
        <BottomBar
          current={state.replayPosition}
          total={state.totalMoves}
        />
      )}

      {state.phase === PHASES.COMPLETE && (
        <CompletionModal
          stats={gameManager.getCompletionStats()}
          onRestart={() => gameManager.resetGame()}
          onGoHome={onGoHome}
        />
      )}
    </div>
  )
}
