import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsibleHeader from './CollapsibleHeader'
import CollapsibleBottomPanel from './CollapsibleBottomPanel'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/boardUtils'
import { PHASES } from '../game/constants'
import { useBoardSize } from '../hooks/useBoardSize'
import { useBorderFlash } from '../hooks/useBorderFlash'
import { trackReplayCompleted, trackGameReset } from '../lib/analytics.js'
import layout from '../styles/GameLayout.module.css'
import replayStyles from '../styles/ReplayPhase.module.css'

function createGhostStoneMap(pendingMove, currentTurn, boardSize) {
  if (!pendingMove) return null
  const map = Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(null))
  map[pendingMove.y][pendingMove.x] = { sign: currentTurn === 'B' ? 1 : -1 }
  return map
}

function trackCompletion(gameManager) {
  const stats = gameManager.getCompletionStats()
  const gameStats = gameManager.getState().stats
  trackReplayCompleted({
    accuracy: stats.accuracy,
    wrongMoveCount: stats.wrongMoveCount,
    totalTimeSeconds: Math.round(stats.totalTimeMs / 1000),
    hintsUsed:
      gameStats.quadrantHintsUsed + gameStats.subdivisionHintsUsed + gameStats.exactHintsUsed
  })
}

export default function ReplayPhase({ gameManager, gameInfo, onGoHome }) {
  const [hintState, setHintState] = useState(null)
  const [borderFlash, triggerFlash] = useBorderFlash()
  const [selectedDifficultMove, setSelectedDifficultMove] = useState(null)
  const [bottomPanelExpanded, setBottomPanelExpanded] = useState(false)
  const [pendingMove, setPendingMove] = useState(null)
  const [hoverVertex, setHoverVertex] = useState(null)

  const state = gameManager.getState()
  const isComplete = state.phase === PHASES.COMPLETE

  const isUserTurn = !isComplete && gameManager.isUserMove(gameManager.replayPosition)

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
        trackCompletion(gameManager)
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

  const commitMove = (x, y) => {
    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setPendingMove(null)
      setHoverVertex(null)
      triggerFlash('success')

      if (result.gameComplete) {
        setBottomPanelExpanded(true)
        trackCompletion(gameManager)
      } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
        scheduleOpponentMove()
      }
    } else if (result.expectedPass) {
      setPendingMove(null)
      triggerFlash('error')
    } else if (result.needHint) {
      setHintState(result)
      setPendingMove(null)
      triggerFlash('error')
    }
  }

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0 || isComplete || !isUserTurn) return

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

  const handlePass = useCallback(() => {
    if (isComplete || !isUserTurn) return

    const result = gameManager.validatePass()

    if (result.correct) {
      setHintState(null)
      setPendingMove(null)
      setHoverVertex(null)
      triggerFlash('success')

      if (result.gameComplete) {
        setBottomPanelExpanded(true)
        trackCompletion(gameManager)
      } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
        scheduleOpponentMove()
      }
    } else if (result.needHint) {
      setHintState(result)
      setPendingMove(null)
      triggerFlash('error')
    }
  }, [gameManager, isComplete, isUserTurn, scheduleOpponentMove, triggerFlash])

  const handleVertexMouseEnter = useCallback(
    (evt, [x, y]) => {
      if (isComplete || !isUserTurn || isMobileLayout) return
      if (!gameManager.isValidPosition(x, y)) return
      setHoverVertex({ x, y })
    },
    [gameManager, isComplete, isUserTurn, isMobileLayout]
  )

  const handleVertexMouseLeave = useCallback(() => {
    setHoverVertex(null)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.code === 'Space' && !isComplete) {
        event.preventDefault()
        handlePass()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePass, isComplete])

  const handleSelectDifficultMove = (move) => {
    setPendingMove(null)
    setSelectedDifficultMove(selectedDifficultMove?.moveIndex === move.moveIndex ? null : move)
  }

  const { markerMap, paintMap } = useMemo(() => {
    const marker = createEmptyBoardMap(state.boardSize)
    const paint = createEmptyBoardMap(state.boardSize)

    if (selectedDifficultMove) {
      selectedDifficultMove.wrongAttempts.forEach(({ x, y }) => {
        marker[y][x] = { type: 'cross' }
      })

      const { x, y } = selectedDifficultMove.correctPosition
      marker[y][x] = { type: 'circle' }
    } else {
      if (lastMove) {
        marker[lastMove.y][lastMove.x] = { type: 'circle' }
      }

      if (hintState?.hintType === 'quadrant' && hintState.region) {
        const { minX, maxX, minY, maxY } = hintState.region
        for (let py = minY; py <= maxY; py++) {
          for (let px = minX; px <= maxX; px++) {
            paint[py][px] = 1
          }
        }
      }

      if (hintState?.hintType === 'exact' && hintState.position) {
        const { x, y } = hintState.position
        marker[y][x] = { type: 'triangle' }
      }
    }

    return { markerMap: marker, paintMap: paint }
  }, [state.boardSize, selectedDifficultMove, lastMove, hintState])

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
  const ghostStoneMap = createGhostStoneMap(
    pendingMove || hoverVertex,
    currentTurn,
    state.boardSize
  )

  const containerClass = [layout.container, isMobileLayout ? layout.mobileLayout : '']
    .filter(Boolean)
    .join(' ')

  const rightPanelContent = (
    <RightPanel
      phase={isComplete ? 'complete' : 'replay'}
      current={state.replayPosition}
      total={state.totalMoves}
      replaySide={gameManager.getReplaySide()}
      stats={stats}
      difficultMoves={difficultMoves}
      onSelectDifficultMove={handleSelectDifficultMove}
      selectedMoveIndex={selectedDifficultMove?.moveIndex}
      onRestart={() => {
        const stats = gameManager.getCompletionStats()
        trackGameReset({ previousAccuracy: stats.accuracy })
        gameManager.resetGame()
        setSelectedDifficultMove(null)
        setPendingMove(null)
      }}
      onGoHome={() => onGoHome(state.phase)}
      onPass={handlePass}
      isUserTurn={isUserTurn}
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
              onVertexMouseEnter={handleVertexMouseEnter}
              onVertexMouseLeave={handleVertexMouseLeave}
              vertexSize={vertexSize}
              hasHoverPreview={!!hoverVertex && !pendingMove}
            />
          </div>
        </div>
      </div>

      {!isMobileLayout && rightPanelContent}

      {isMobileLayout && !isComplete && (
        <BottomBar
          current={state.replayPosition}
          total={state.totalMoves}
          replaySide={gameManager.getReplaySide()}
          pendingMove={pendingMove}
          onConfirm={handleConfirm}
          onPass={handlePass}
          isUserTurn={isUserTurn}
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
