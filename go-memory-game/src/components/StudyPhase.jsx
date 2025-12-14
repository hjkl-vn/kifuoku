import React, { useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import GameInfo from './GameInfo'

export default function StudyPhase({ gameManager, gameInfo }) {
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
      <div style={styles.leftPanel}>
        <h2 style={styles.phaseName}>Study Phase</h2>
        <GameInfo gameInfo={gameInfo} />
        <div style={styles.controls}>
          <button
            style={{
              ...styles.button,
              ...(canGoPrev ? {} : styles.buttonDisabled)
            }}
            onClick={() => gameManager.studyPrev()}
            disabled={!canGoPrev}
          >
            Previous
          </button>

          <button
            style={{
              ...styles.button,
              ...(canGoNext ? {} : styles.buttonDisabled)
            }}
            onClick={() => gameManager.studyNext()}
            disabled={!canGoNext}
          >
            Next
          </button>
        </div>

        {!canGoNext && state.studyPosition > 0 && (
          <button
            style={styles.readyButton}
            onClick={() => gameManager.startReplay()}
          >
            Start Replay Challenge
          </button>
        )}

        <div style={styles.statusArea}>
          {!canGoNext && state.studyPosition > 0 && (
            <p style={styles.statusText}>
              You've reviewed all {state.totalMoves} moves.
            </p>
          )}
        </div>
      </div>

      <div style={styles.centerPanel}>
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
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.statsBox}>
          <h3 style={styles.statsTitle}>Current Move</h3>
          <div style={styles.statRow}>
            <span>Position</span>
            <span>{state.studyPosition} / {state.totalMoves}</span>
          </div>
          {lastMove && (
            <>
              <div style={styles.statRow}>
                <span>Color</span>
                <span>{lastMove.color === 'B' ? 'Black' : 'White'}</span>
              </div>
              <div style={styles.statRow}>
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

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    gap: '40px',
    padding: '20px',
    fontFamily: 'sans-serif',
    minHeight: '100vh',
    boxSizing: 'border-box'
  },
  leftPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: '250px',
    maxWidth: '280px'
  },
  centerPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  rightPanel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    minWidth: '200px'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  phaseName: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: 0
  },
  controls: {
    display: 'flex',
    gap: '10px'
  },
  button: {
    flex: 1,
    padding: '12px 20px',
    fontSize: '16px',
    fontWeight: 'bold',
    backgroundColor: '#2196F3',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    cursor: 'not-allowed'
  },
  readyButton: {
    padding: '15px 30px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer'
  },
  statusArea: {
    marginTop: 'auto'
  },
  statusText: {
    fontSize: '16px',
    color: '#666',
    margin: 0
  },
  statsBox: {
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    padding: '15px'
  },
  statsTitle: {
    margin: '0 0 15px 0',
    fontSize: '18px'
  },
  statRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #ddd'
  }
}
