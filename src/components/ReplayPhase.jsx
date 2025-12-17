import React, { useState } from 'react'
import Board from './Board'
import ProgressBar from './ProgressBar'
import Sidebar from './Sidebar'
import CollapsibleHeader from './CollapsibleHeader'
import CompletionModal from './CompletionModal'
import { createEmptyBoardMap } from '../game/board-utils'
import { HINT_LETTERS, BORDER_FLASH_DURATION_MS, PHASES } from '../game/constants'
import layout from '../styles/gameLayout.module.css'
import styles from './ReplayPhase.module.css'

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedLetters, setEliminatedLetters] = useState([])
  const [borderFlash, setBorderFlash] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return

    if (hintState?.hintType === 'ghost') {
      const clickResult = gameManager.handleGhostClick(x, y)

      if (clickResult.error) return

      if (clickResult.correct) {
        setHintState(null)
        setEliminatedLetters([])
        setBorderFlash('success')
        setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
      } else {
        setEliminatedLetters(prev => [...prev, { x, y }])
      }
      return
    }

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    } else if (result.needHint) {
      setHintState(result)
      setEliminatedLetters([])
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    }
  }

  const markerMap = createEmptyBoardMap(state.boardSize)
  const paintMap = createEmptyBoardMap(state.boardSize)

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  if (hintState?.hintType === 'quadrant' && hintState.vertices) {
    hintState.vertices.forEach(([x, y]) => {
      paintMap[y][x] = 1
    })
  }

  if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
    hintState.ghostStones.forEach((ghost, index) => {
      const isEliminated = eliminatedLetters.some(g => g.x === ghost.x && g.y === ghost.y)
      if (!isEliminated) {
        markerMap[ghost.y][ghost.x] = { type: 'label', label: HINT_LETTERS[index] }
      }
    })
  }

  if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
    const { x, y } = hintState.correctPosition
    markerMap[y][x] = { type: 'point' }
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? styles.borderSuccess : '',
    borderFlash === 'error' ? styles.borderError : ''
  ].filter(Boolean).join(' ')

  const stats = {
    correctFirstTry: state.stats.correctFirstTry,
    wrongMoveCount: state.stats.wrongMoveCount
  }

  return (
    <div className={styles.replayContainer}>
      <CollapsibleHeader
        gameInfo={gameInfo}
        phase="replay"
        current={state.replayPosition}
        total={state.totalMoves}
        stats={stats}
      />

      <Sidebar
        gameInfo={gameInfo}
        phase="replay"
        canGoPrev={false}
        canGoNext={false}
        stats={stats}
      />

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.progressBarWrapper}>
            <ProgressBar current={state.replayPosition} total={state.totalMoves} />
          </div>
          <div className={boardContainerClass}>
            <Board
              signMap={board.signMap}
              markerMap={markerMap}
              paintMap={paintMap}
              onVertexClick={handleVertexClick}
            />
          </div>
        </div>
      </div>

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
