import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import PropTypes from 'prop-types'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsiblePanel from './CollapsiblePanel'
import GameInfo from './GameInfo'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/boardUtils'
import {
  PHASES,
  OPPONENT_MOVE_BASE_DELAY_MS,
  OPPONENT_MOVE_RANDOM_DELAY_MS
} from '../game/constants'
import { useBoardSize } from '../hooks/useBoardSize'
import { useIsMobile } from '../hooks/useIsMobile'
import { useBorderFlash } from '../hooks/useBorderFlash'
import { trackReplayCompleted, trackGameReset } from '../lib/analytics.js'
import { getPlayerSummary } from '../lib/formatters.js'

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

  const { containerRef, vertexSize } = useBoardSize({
    boardSize: state.boardSize
  })
  const isMobile = useIsMobile()

  const autoPlayTimeoutRef = useRef(null)

  const scheduleOpponentMove = useCallback(() => {
    if (autoPlayTimeoutRef.current) {
      clearTimeout(autoPlayTimeoutRef.current)
    }

    const delay = OPPONENT_MOVE_BASE_DELAY_MS + Math.random() * OPPONENT_MOVE_RANDOM_DELAY_MS
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
    if (!gameManager.isValidPosition(x, y)) return

    if (isMobile) {
      setPendingMove({ x, y })
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
      if (isComplete || !isUserTurn) return
      if (!gameManager.isValidPosition(x, y)) return
      setHoverVertex({ x, y })
    },
    [gameManager, isComplete, isUserTurn]
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
      if (lastMove && !lastMove.isPass) {
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

  const borderFlashClass = [
    'rounded-sm transition-shadow duration-200',
    borderFlash === 'success' ? 'shadow-[0_0_0_3px_var(--color-success)]' : '',
    borderFlash === 'error' ? 'shadow-[0_0_0_3px_var(--color-error)]' : ''
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
    <div
      className={[
        'flex flex-1 min-h-0',
        isMobile ? 'flex-col gap-0 p-0' : 'gap-5 px-5 py-3 pb-5'
      ].join(' ')}
    >
      {isMobile && (
        <CollapsiblePanel
          position="top"
          title={getPlayerSummary(gameInfo)}
          expandedTitle="Hide Game Info"
        >
          <div className="flex flex-col gap-4">
            <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
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
          </div>
        </CollapsiblePanel>
      )}

      {!isMobile && <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />}

      <div
        className={[
          'flex-[2] flex flex-col items-center min-h-0 min-w-0',
          isMobile ? 'p-px flex-1' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col items-stretch gap-1 flex-1 min-h-0 w-full">
          <div
            className="flex justify-center items-center w-full flex-1 min-h-0"
            ref={containerRef}
          >
            <div className={borderFlashClass}>
              <Board
                signMap={board?.signMap}
                markerMap={markerMap}
                paintMap={paintMap}
                ghostStoneMap={ghostStoneMap}
                onVertexClick={handleVertexClick}
                onVertexMouseEnter={handleVertexMouseEnter}
                onVertexMouseLeave={handleVertexMouseLeave}
                vertexSize={vertexSize}
                oneColorMode={state.oneColorMode}
              />
            </div>
          </div>
        </div>
      </div>

      {!isMobile && rightPanelContent}

      {isMobile && !isComplete && (
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

      {isMobile && isComplete && (
        <CollapsiblePanel
          position="bottom"
          isExpanded={bottomPanelExpanded}
          onToggle={setBottomPanelExpanded}
          title="Show Stats"
          expandedTitle="Hide Stats"
        >
          {rightPanelContent}
        </CollapsiblePanel>
      )}
    </div>
  )
}

ReplayPhase.propTypes = {
  gameManager: PropTypes.object.isRequired,
  gameInfo: PropTypes.object,
  onGoHome: PropTypes.func.isRequired
}
