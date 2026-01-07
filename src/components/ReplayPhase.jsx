import React, { useState, useEffect, useCallback, useRef } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsibleHeader from './CollapsibleHeader'
import CollapsibleBottomPanel from './CollapsibleBottomPanel'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/boardUtils'
import { BORDER_FLASH_DURATION_MS, PHASES, MARKER_COLORS } from '../game/constants'
import { useBoardSize } from '../hooks/useBoardSize'
import layout from '../styles/GameLayout.module.css'
import replayStyles from '../styles/ReplayPhase.module.css'

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [borderFlash, setBorderFlash] = useState(null)
  const [selectedDifficultMove, setSelectedDifficultMove] = useState(null)
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)

  const state = gameManager.getState()
  const isComplete = state.phase === PHASES.COMPLETE

  const board = selectedDifficultMove
    ? gameManager.getBoardAtPosition(selectedDifficultMove.moveIndex)
    : gameManager.getCurrentBoard()

  const lastMove = selectedDifficultMove ? null : gameManager.getLastMove()

  const { containerRef, vertexSize, isMobileLayout } = useBoardSize({
    boardSize: state.boardSize
  })

  const autoPlayTimeoutRef = useRef(null)

  const scheduleOpponentMove = useCallback(() => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }

    const delay = 500 + Math.random() * 500
    autoPlayTimeoutRef.current = setTimeout(() => {
      const result = gameManager.playOpponentMove()
      if (result.success && !result.gameComplete) {
        if (!gameManager.isUserMove(gameManager.replayPosition)) {
          scheduleOpponentMove()
        }
      }
      if (result.gameComplete) {
        setBottomPanelExpanded(true)
      }
    }, delay)
  }, [gameManager])

  useEffect(() => {
    const replaySide = gameManager.getReplaySide()
    if (replaySide === null || isComplete) return

    if (!gameManager.isUserMove(gameManager.replayPosition)) {
      scheduleOpponentMove()
    }

    return () => {
      if (autoPlayTimeoutRef.current) {
        clearTimeout(autoPlayTimeoutRef.current)
      }
    }
  }, [gameManager, gameManager.replayPosition, isComplete, scheduleOpponentMove])

  const createGhostStoneMap = (pendingMove, currentTurn, boardSize) => {
    if (!pendingMove) return null
    const map = Array(boardSize)
      .fill(null)
      .map(() => Array(boardSize).fill(null))
    map[pendingMove.y][pendingMove.x] = { sign: currentTurn === 'B' ? 1 : -1 }
    return map
  }

  const commitMove = (x, y) => {
    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setPendingMove(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

      if (result.gameComplete) {
        setBottomPanelExpanded(true)
      } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
        scheduleOpponentMove()
      }
    } else if (result.needHint) {
      setHintState(result)
      setPendingMove(null)
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
    }
  }

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0 || isComplete) return

    if (isMobileLayout) {
      if (gameManager.isValidPosition(x, y)) {
        setPendingMove({ x, y })
      }
    } else {
      commitMove(x, y)
    }
  }

  const handleConfirm = () => {
    if (pendingMove) {
      commitMove(pendingMove.x, pendingMove.y)
    }
  }

  const handleCancel = () => {
    setPendingMove(null)
  }

  const handleSelectDifficultMove = (move) => {
    setPendingMove(null)
    setSelectedDifficultMove(selectedDifficultMove?.moveIndex === move.moveIndex ? null : move)
  }

  const markerMap = createEmptyBoardMap(state.boardSize)
  const paintMap = createEmptyBoardMap(state.boardSize)

  if (selectedDifficultMove) {
    selectedDifficultMove.wrongAttempts.forEach(({ x, y }) => {
      markerMap[y][x] = { type: 'circle', label: '', color: MARKER_COLORS.WRONG_ATTEMPT }
    })
    const { x, y } = selectedDifficultMove.correctPosition
    markerMap[y][x] = { type: 'triangle', color: MARKER_COLORS.CORRECT_POSITION }
  } else {
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
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? replayStyles.borderSuccess : '',
    borderFlash === 'error' ? replayStyles.borderError : ''
  ]
    .filter(Boolean)
    .join(' ')

  const stats = isComplete
    ? gameManager.getCompletionStats()
    : {
        correctFirstTry: state.stats.correctFirstTry,
        wrongMoveCount: state.stats.wrongMoveCount
      }

  const difficultMoves = isComplete ? gameManager.getDifficultMoves(5) : []
  const currentTurn = gameManager.getCurrentTurn()
  const ghostStoneMap = createGhostStoneMap(pendingMove, currentTurn, state.boardSize)

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  const rightPanelContent = (
    <RightPanel
      phase={isComplete ? 'complete' : 'replay'}
      current={state.replayPosition}
      total={state.totalMoves}
      stats={stats}
      difficultMoves={difficultMoves}
      onSelectDifficultMove={handleSelectDifficultMove}
      selectedMoveIndex={selectedDifficultMove?.moveIndex}
      onRestart={() => {
        gameManager.resetGame()
        setSelectedDifficultMove(null)
        setPendingMove(null)
      }}
      onGoHome={onGoHome}
    />
  )

  return (
    <div className={containerClass}>
      {isMobileLayout && (
        <CollapsibleHeader
          gameInfo={gameInfo}
          phase="replay"
          current={state.replayPosition}
          total={state.totalMoves}
          stats={stats}
          currentTurn={currentTurn}
        />
      )}

      {!isMobileLayout && <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={boardContainerClass} ref={containerRef}>
            <Board
              signMap={board?.signMap}
              markerMap={markerMap}
              paintMap={paintMap}
              ghostStoneMap={ghostStoneMap}
              onVertexClick={handleVertexClick}
              vertexSize={vertexSize}
            />
          </div>
        </div>
      </div>

      {!isMobileLayout && rightPanelContent}

      {isMobileLayout && !isComplete && (
        <BottomBar
          current={state.replayPosition}
          total={state.totalMoves}
          pendingMove={pendingMove}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {isMobileLayout && isComplete && (
        <CollapsibleBottomPanel isExpanded={bottomPanelExpanded} onToggle={setBottomPanelExpanded}>
          {rightPanelContent}
        </CollapsibleBottomPanel>
      )}
    </div>
  )
}
