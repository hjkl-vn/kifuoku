import React, { useState, useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import { callLuaFunction } from '../lib/lua-bridge.js'

export default function StudyPhase({ gameState: initialState }) {
  const [state, setState] = useState(initialState)
  const [currentMove, setCurrentMove] = useState(null)

  const handleNext = () => {
    const result = callLuaFunction('studyNext')
    if (result.success) {
      setState(callLuaFunction('getGameState'))
      setCurrentMove(result.move)
    }
  }

  const handlePrev = () => {
    const result = callLuaFunction('studyPrev')
    if (result.success) {
      setState(callLuaFunction('getGameState'))
      setCurrentMove(null)
    }
  }

  const handleStartReplay = () => {
    const result = callLuaFunction('beginReplay')
    if (result.success) {
      setState(callLuaFunction('getGameState'))
    }
  }

  const canGoNext = state.studyPosition < state.totalMoves
  const canGoPrev = state.studyPosition > 0
  const hasStudied = state.studyPosition > 0

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Study Phase</h2>

      <div style={styles.info}>
        <p>Move {state.studyPosition} of {state.totalMoves}</p>
        {currentMove && (
          <p style={styles.moveInfo}>
            Last move: {currentMove.color} at ({currentMove.x}, {currentMove.y})
          </p>
        )}
      </div>

      <div style={styles.boardContainer}>
        <Goban
          animateStonePlacement={true}
          busy={false}
          fuzzyStonePlacement={true}
          showCoordinates={true}
          signMap={state.boardState}
          vertexSize={34}
        />
      </div>

      <div style={styles.controls}>
        <button
          style={{
            ...styles.button,
            ...(canGoPrev ? {} : styles.buttonDisabled)
          }}
          onClick={handlePrev}
          disabled={!canGoPrev}
        >
          ← Previous
        </button>

        <button
          style={{
            ...styles.button,
            ...(canGoNext ? {} : styles.buttonDisabled)
          }}
          onClick={handleNext}
          disabled={!canGoNext}
        >
          Next →
        </button>
      </div>

      {!canGoNext && hasStudied && (
        <div style={styles.readySection}>
          <p style={styles.readyText}>
            You've reviewed all {state.totalMoves} moves.
          </p>
          <button
            style={styles.startButton}
            onClick={handleStartReplay}
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
  info: {
    textAlign: 'center',
    marginBottom: '20px',
    fontSize: '16px'
  },
  moveInfo: {
    color: '#666',
    fontStyle: 'italic'
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
