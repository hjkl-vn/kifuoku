import React, { useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'

export default function StudyPhase({ gameManager }) {
  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = state.studyPosition > 0
    ? gameManager.moves[state.studyPosition - 1]
    : null

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
    <div style={styles.container}>
      <h2 style={styles.title}>Study Phase</h2>

      <ProgressBar current={state.studyPosition} total={state.totalMoves} />

      <div style={styles.boardContainer}>
        <Goban
          animateStonePlacement={true}
          busy={true}
          fuzzyStonePlacement={true}
          showCoordinates={true}
          signMap={board.signMap}
          markerMap={markerMap}
          vertexSize={34}
        />
      </div>

      <div style={styles.controls}>
        <button
          style={{
            ...styles.button,
            ...(canGoPrev ? {} : styles.buttonDisabled)
          }}
          onClick={() => gameManager.studyPrev()}
          disabled={!canGoPrev}
        >
          ← Previous
        </button>

        <button
          style={{
            ...styles.button,
            ...(canGoNext ? {} : styles.buttonDisabled)
          }}
          onClick={() => gameManager.studyNext()}
          disabled={!canGoNext}
        >
          Next →
        </button>
      </div>

      {!canGoNext && state.studyPosition > 0 && (
        <div style={styles.readySection}>
          <p style={styles.readyText}>
            You've reviewed all {state.totalMoves} moves.
          </p>
          <button
            style={styles.startButton}
            onClick={() => gameManager.startReplay()}
          >
            Start Replay Challenge
          </button>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '800px',
    margin: '20px auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '28px',
    marginBottom: '10px'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginBottom: '20px'
  },
  controls: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginBottom: '30px'
  },
  button: {
    padding: '12px 30px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  readySection: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#e8f5e9',
    borderRadius: '10px'
  },
  readyText: {
    fontSize: '18px',
    marginBottom: '15px',
    fontWeight: 'bold'
  },
  startButton: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  }
}
