import React, { useCallback, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import CollapsiblePanel from './CollapsiblePanel'
import GameInfo from './GameInfo'
import RangeSlider from './RangeSlider'
import BottomBar from './BottomBar'
import { createEmptyBoardMap } from '../game/boardUtils'
import { trackReplayStarted, trackAnnotationUsed } from '../lib/analytics.js'
import { getPlayerSummary } from '../lib/formatters.js'
import { useBoardSize } from '../hooks/useBoardSize'
import { useIsMobile } from '../hooks/useIsMobile'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

  const [rangeStart, setRangeStart] = useState(0)
  const [rangeEnd, setRangeEnd] = useState(state.totalMoves - 1)
  const [selectedTool, setSelectedTool] = useState(null)
  const [annotations, setAnnotations] = useState({})
  const [hoverVertex, setHoverVertex] = useState(null)
  const [oneColorMode, setOneColorMode] = useState(false)

  const { containerRef, vertexSize } = useBoardSize({
    boardSize: state.boardSize
  })
  const isMobile = useIsMobile()

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

  const currentAnnotations = annotations[state.studyPosition] || []

  const getNextLabel = (existingAnnotations) => {
    const usedLabels = existingAnnotations
      .filter((a) => a.type === 'label' && a.label)
      .map((a) => a.label)
      .sort()

    let nextChar = 'A'
    for (const label of usedLabels) {
      if (label === nextChar) {
        nextChar = String.fromCharCode(nextChar.charCodeAt(0) + 1)
      } else {
        break
      }
    }
    return nextChar
  }

  const handleBoardClick = (evt, [x, y]) => {
    if (evt.button !== 0 || !selectedTool) return

    const existing = currentAnnotations.find((a) => a.x === x && a.y === y)

    if (existing) {
      setAnnotations((prev) => ({
        ...prev,
        [state.studyPosition]: currentAnnotations.filter((a) => !(a.x === x && a.y === y))
      }))
    } else {
      trackAnnotationUsed()
      const newAnnotation = {
        x,
        y,
        type: selectedTool,
        label: selectedTool === 'label' ? getNextLabel(currentAnnotations) : undefined
      }

      setAnnotations((prev) => ({
        ...prev,
        [state.studyPosition]: [...currentAnnotations, newAnnotation]
      }))
    }
  }

  const markerMap = createEmptyBoardMap(state.boardSize)

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  currentAnnotations.forEach((annotation) => {
    if (annotation.type === 'label') {
      markerMap[annotation.y][annotation.x] = { type: 'label', label: annotation.label }
    } else {
      markerMap[annotation.y][annotation.x] = { type: annotation.type }
    }
  })

  if (hoverVertex && selectedTool && !isMobile) {
    const existingMarker = markerMap[hoverVertex.y][hoverVertex.x]
    if (!existingMarker) {
      markerMap[hoverVertex.y][hoverVertex.x] = {
        type: selectedTool === 'label' ? 'label' : selectedTool,
        label: selectedTool === 'label' ? '?' : undefined
      }
    }
  }

  const handleRangeChange = (start, end) => {
    setRangeStart(start)
    setRangeEnd(end)
  }

  const handleVertexMouseEnter = useCallback(
    (evt, [x, y]) => {
      if (!selectedTool || isMobile) return
      setHoverVertex({ x, y })
    },
    [selectedTool, isMobile]
  )

  const handleVertexMouseLeave = useCallback(() => {
    setHoverVertex(null)
  }, [])

  const handleStartReplay = (side = null) => {
    trackReplayStarted({
      side: side || 'both',
      rangeLength: rangeEnd - rangeStart + 1
    })
    gameManager.startReplay(rangeStart, rangeEnd, side, oneColorMode)
  }

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
          <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
        </CollapsiblePanel>
      )}

      {!isMobile && <Sidebar gameInfo={gameInfo} currentTurn={currentTurn} />}

      <div
        className={[
          'flex-[2] flex flex-col items-center min-h-0 min-w-0',
          isMobile ? 'p-px flex-1 pt-[50px] pb-[145px]' : ''
        ]
          .filter(Boolean)
          .join(' ')}
      >
        <div className="flex flex-col items-stretch gap-1 flex-1 min-h-0 w-full">
          <div
            className="flex justify-center items-center w-full flex-1 min-h-0"
            ref={containerRef}
          >
            <Board
              signMap={board.signMap}
              markerMap={markerMap}
              vertexSize={vertexSize}
              onVertexClick={handleBoardClick}
              onVertexMouseEnter={handleVertexMouseEnter}
              onVertexMouseLeave={handleVertexMouseLeave}
            />
          </div>
        </div>
      </div>

      {!isMobile && (
        <RightPanel
          phase="study"
          current={state.studyPosition}
          total={state.totalMoves}
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          totalMoves={state.totalMoves}
          onRangeChange={handleRangeChange}
          onStartReplay={handleStartReplay}
          gameInfo={gameInfo}
          oneColorMode={oneColorMode}
          onOneColorModeChange={setOneColorMode}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
      )}

      {isMobile && (
        <CollapsiblePanel
          position="bottom"
          title="Start Replay"
          expandedTitle="Hide Replay Options"
        >
          <div className="flex flex-col gap-3">
            <RangeSlider
              min={0}
              max={state.totalMoves - 1}
              start={rangeStart}
              end={rangeEnd}
              onChange={handleRangeChange}
            />
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={oneColorMode}
                onChange={(e) => setOneColorMode(e.target.checked)}
                className="w-4 h-4 accent-primary cursor-pointer"
              />
              One color Go
            </label>
            <div className="flex flex-col gap-2">
              <button
                className="py-3 px-5 text-base font-bold bg-success text-white border-none rounded cursor-pointer"
                onClick={() => handleStartReplay()}
              >
                Replay
              </button>
              <button
                className="py-3 px-5 text-base font-bold bg-stone-black text-white border-none rounded cursor-pointer hover:bg-gray-800"
                onClick={() => handleStartReplay('B')}
              >
                Replay as {gameInfo?.blackPlayer || 'Black'}
              </button>
              <button
                className="py-3 px-5 text-base font-bold bg-stone-white text-stone-black border-2 border-stone-black rounded cursor-pointer hover:bg-gray-200"
                onClick={() => handleStartReplay('W')}
              >
                Replay as {gameInfo?.whitePlayer || 'White'}
              </button>
            </div>
          </div>
        </CollapsiblePanel>
      )}

      {isMobile && (
        <BottomBar
          canGoPrev={canGoPrev}
          canGoNext={canGoNext}
          onPrev={() => gameManager.studyPrev()}
          onNext={() => gameManager.studyNext()}
          current={state.studyPosition}
          total={state.totalMoves}
          selectedTool={selectedTool}
          onSelectTool={setSelectedTool}
        />
      )}
    </div>
  )
}

StudyPhase.propTypes = {
  gameManager: PropTypes.object.isRequired,
  gameInfo: PropTypes.object
}
