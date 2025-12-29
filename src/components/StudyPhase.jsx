import React, { useEffect, useState } from 'react'
import Board from './Board'
import Sidebar from './Sidebar'
import RightPanel from './RightPanel'
import AnnotationToolbar from './AnnotationToolbar'
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
  const [selectedTool, setSelectedTool] = useState(null)
  const [annotations, setAnnotations] = useState({})
  const [nextLabel, setNextLabel] = useState('A')

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

  const currentAnnotations = annotations[state.studyPosition] || []

  const handleBoardClick = (evt, [x, y]) => {
    if (evt.button !== 0 || !selectedTool) return

    const existing = currentAnnotations.find((a) => a.x === x && a.y === y)

    if (existing) {
      setAnnotations((prev) => ({
        ...prev,
        [state.studyPosition]: currentAnnotations.filter((a) => !(a.x === x && a.y === y))
      }))
    } else {
      const newAnnotation = {
        x,
        y,
        type: selectedTool,
        label: selectedTool === 'label' ? nextLabel : undefined
      }

      if (selectedTool === 'label') {
        setNextLabel(String.fromCharCode(nextLabel.charCodeAt(0) + 1))
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
        <Sidebar gameInfo={gameInfo} currentTurn={currentTurn}>
          <AnnotationToolbar selectedTool={selectedTool} onSelectTool={setSelectedTool} />
        </Sidebar>
      )}

      <div className={layout.boardArea}>
        <div className={layout.boardWrapper}>
          <div className={layout.boardContainer} ref={containerRef}>
            <Board
              signMap={board.signMap}
              markerMap={markerMap}
              vertexSize={vertexSize}
              onVertexClick={handleBoardClick}
            />
          </div>
        </div>
      </div>

      {!isMobileLayout && (
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
        />
      )}

      {isMobileLayout && (
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
