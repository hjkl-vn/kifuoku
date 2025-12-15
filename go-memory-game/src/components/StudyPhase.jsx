import React, { useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import GameInfo from './GameInfo'
import layout from '../styles/layout.module.css'
import buttons from '../styles/buttons.module.css'

export default function StudyPhase({ gameManager, gameInfo }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

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

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [canGoNext, canGoPrev, gameManager])

  const markerMap = lastMove
    ? Array(19).fill(null).map(() => Array(19).fill(null))
    : null

  if (markerMap && lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  return (
    <div className={layout.container}>
      <div className={layout.leftPanel}>
        {/* <h2 className={layout.phaseName}>Study Phase</h2> */}
        <GameInfo gameInfo={gameInfo} />
        <div className={buttons.controls}>
          <button
            className={buttons.buttonFlex}
            onClick={() => gameManager.studyPrev()}
            disabled={!canGoPrev}
          >
            Previous
          </button>

          <button
            className={buttons.buttonFlex}
            onClick={() => gameManager.studyNext()}
            disabled={!canGoNext}
          >
            Next
          </button>
        </div>

        {!canGoNext && state.studyPosition > 0 && (
          <button
            className={buttons.primaryButton}
            onClick={() => gameManager.startReplay()}
          >
            Start Replay Challenge
          </button>
        )}

        <div className={layout.statusArea}>
          {!canGoNext && state.studyPosition > 0 && (
            <p className={layout.statusText}>
              You've reviewed all {state.totalMoves} moves.
            </p>
          )}
        </div>
      </div>

      <div className={layout.centerPanel}>
        <ProgressBar current={state.studyPosition} total={state.totalMoves} />
        <div className={layout.boardContainer}>
          <Goban
            animateStonePlacement={true}
            busy={false}
            fuzzyStonePlacement={true}
            showCoordinates={true}
            signMap={board.signMap}
            markerMap={markerMap}
            vertexSize={34}
          />
        </div>
      </div>

      <div className={layout.rightPanel}>
        <div className={layout.statsBox}>
          <h3 className={layout.phaseName}>Study phase</h3>
          {lastMove && (
            <>
              <div className={layout.statRow}>
                <span>Color</span>
                <span>{lastMove.color === 'B' ? 'Black' : 'White'}</span>
              </div>
              <div className={layout.statRow}>
                <span>Coordinate</span>
                <span>{String.fromCharCode(65 + lastMove.x)}{19 - lastMove.y}</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
