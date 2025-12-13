import React, { useState, useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import { colorToSign } from '../game/constants'

export default function ReplayPhase({ gameManager }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedGhosts, setEliminatedGhosts] = useState([])
  const [feedback, setFeedback] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = state.studyPosition > 0
    ? gameManager.moves[state.studyPosition - 1]
    : null

  useEffect(() => {
    if (state.phase === 'complete') {
      onComplete()
    }
  }, [state.phase])

  const handleVertexClick = (evt, [x, y]) => {
    if (evt.button !== 0) return

    if (hintState?.hintType === 'ghost') {
      const clickResult = gameManager.handleGhostClick(x, y)

      if (clickResult.error) return

      if (clickResult.correct) {
        setHintState(null)
        setEliminatedGhosts([])
        setFeedback({ type: 'success', message: 'Correct!' })
        setTimeout(() => setFeedback(null), 1000)
      } else {
        setEliminatedGhosts(prev => [...prev, { x, y }])
        setTimeout(() => {
          setEliminatedGhosts(prev => prev.filter(g => g.x !== x || g.y !== y))
        }, 1000)
      }
      return
    }

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setFeedback({ type: 'success', message: 'Correct!' })
      setTimeout(() => setFeedback(null), 1000)

      if (result.gameComplete) {
        setTimeout(() => onComplete(), 1500)
      }
    } else if (result.needHint) {
      setHintState(result)
      setFeedback({ type: 'error', message: 'Wrong move!' })
      setTimeout(() => setFeedback(null), 1000)
    }
  }

  const onComplete = () => {
    const totalTime = Date.now() - state.stats.startTime
    const avgTime = state.totalMoves > 0 ? totalTime / state.totalMoves : 0
    alert(`Game Complete!\n\nTotal time: ${(totalTime / 1000).toFixed(1)}s\nAvg per move: ${(avgTime / 1000).toFixed(2)}s\nWrong moves: ${state.stats.wrongMoveCount}`)
  }

  const markerMap = Array(19).fill(null).map(() => Array(19).fill(null))

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  const ghostStoneMap = Array(19).fill(null).map(() => Array(19).fill(null))
  const paintMap = Array(19).fill(null).map(() => Array(19).fill(null))

  if (hintState?.hintType === 'quadrant' && hintState.vertices) {
    hintState.vertices.forEach(([x, y]) => {
      paintMap[y][x] = 1
    })
  }

  if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
    const sign = colorToSign(hintState.nextColor)
    hintState.ghostStones.forEach(ghost => {
      ghostStoneMap[ghost.y][ghost.x] = { sign, faint: false }

      const isEliminated = eliminatedGhosts.some(g => g.x === ghost.x && g.y === ghost.y)
      if (isEliminated) {
        markerMap[ghost.y][ghost.x] = { type: 'cross' }
      }
    })
  }

  if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
    const { x, y } = hintState.correctPosition
    const sign = colorToSign(hintState.nextColor)
    ghostStoneMap[y][x] = { sign, faint: false }
    markerMap[y][x] = { type: 'triangle' }
  }

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Replay Challenge</h2>

      <div style={styles.stats}>
        <span>Correct: {state.stats.correctFirstTry}</span>
        <span>Wrong: {state.stats.wrongMoveCount}</span>
      </div>

      <ProgressBar current={state.replayPosition} total={state.totalMoves} />

      {feedback && (
        <div style={{
          ...styles.feedback,
          ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError)
        }}>
          {feedback.message}
        </div>
      )}

      {hintState?.hintType === 'quadrant' && (
        <div style={styles.hint}>
          Try the {hintState.quadrant} quadrant
        </div>
      )}

      <div style={styles.boardContainer}>
        <Goban
          animateStonePlacement={true}
          busy={false}
          fuzzyStonePlacement={true}
          showCoordinates={true}
          signMap={board.signMap}
          markerMap={markerMap}
          ghostStoneMap={ghostStoneMap}
          paintMap={paintMap}
          vertexSize={34}
          onVertexClick={handleVertexClick}
        />
      </div>
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
    marginBottom: '10px',
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
  hint: {
    textAlign: 'center',
    padding: '15px',
    backgroundColor: '#fff3cd',
    borderRadius: '5px',
    marginBottom: '10px',
    fontSize: '16px',
    fontWeight: 'bold'
  },
  boardContainer: {
    display: 'flex',
    justifyContent: 'center'
  }
}
