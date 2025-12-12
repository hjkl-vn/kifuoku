import React, { useState } from 'react'
import { Goban } from '@sabaki/shudan'
import { callLuaFunction } from '../lib/lua-bridge.js'

export default function ReplayPhase({ gameState: initialState, onComplete }) {
  const [state, setState] = useState(initialState)
  const [feedback, setFeedback] = useState(null)
  const [showHint, setShowHint] = useState(false)

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return // Only left click

    const result = callLuaFunction('replayMove', x, y)

    if (result.correct) {
      // Correct move
      setState(callLuaFunction('getGameState'))
      setFeedback({ type: 'success', message: 'Correct!' })
      setShowHint(false)

      setTimeout(() => setFeedback(null), 1000)

      if (result.gameComplete) {
        setTimeout(() => onComplete(), 1500)
      }
    } else if (result.needHint) {
      // Wrong move - show hint (will implement in next task)
      setFeedback({ type: 'error', message: 'Wrong move!' })
      setShowHint(true)
    }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Replay Challenge</h2>

      <div style={styles.stats}>
        <span>Move {state.currentMoveIndex} of {state.totalMoves}</span>
        <span>Correct: {state.correctFirstTry}</span>
        <span>Wrong: {state.wrongMoveCount}</span>
      </div>

      {feedback && (
        <div style={{
          ...styles.feedback,
          ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError)
        }}>
          {feedback.message}
        </div>
      )}

      <div style={styles.boardContainer}>
        <Goban
          vertexSize={28}
          signMap={state.boardState}
          showCoordinates={true}
          onVertexMouseUp={handleVertexClick}
        />
      </div>

      {showHint && (
        <div style={styles.hint}>
          <p>Hint system will appear here (next task)</p>
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
  stats: {
    display: 'flex',
    justifyContent: 'center',
    gap: '30px',
    marginBottom: '20px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  feedback: {
    textAlign: 'center',
    padding: '10px',
    borderRadius: '5px',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  feedbackSuccess: {
    backgroundColor: '#c8e6c9',
    color: '#2e7d32'
  },
  feedbackError: {
    backgroundColor: '#ffcdd2',
    color: '#c62828'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center'
  },
  hint: {
    marginTop: '20px',
    padding: '20px',
    backgroundColor: '#fff3cd',
    borderRadius: '5px',
    textAlign: 'center'
  }
}
