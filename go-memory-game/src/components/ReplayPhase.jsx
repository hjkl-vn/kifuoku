import React, { useState, useEffect } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import GameInfo from './GameInfo'
import { colorToSign } from '../game/constants'

const HINT_LETTERS = ['A', 'B', 'C', 'D']

export default function ReplayPhase({ gameManager, gameInfo }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedLetters, setEliminatedLetters] = useState([])
  const [borderFlash, setBorderFlash] = useState(null)

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
        setEliminatedLetters([])
        setBorderFlash('success')
        setTimeout(() => setBorderFlash(null), 500)
      } else {
        setEliminatedLetters(prev => [...prev, { x, y }])
      }
      return
    }

    const result = gameManager.validateMove(x, y)

    if (result.correct) {
      setHintState(null)
      setBorderFlash('success')
      setTimeout(() => setBorderFlash(null), 500)

      if (result.gameComplete) {
        setTimeout(() => onComplete(), 1000)
      }
    } else if (result.needHint) {
      setHintState(result)
      setEliminatedLetters([])
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), 500)
    }
  }

  const onComplete = () => {
    const totalTime = Date.now() - state.stats.startTime
    const avgTime = state.totalMoves > 0 ? totalTime / state.totalMoves : 0
    alert(`Game Complete!\n\nTotal time: ${(totalTime / 1000).toFixed(1)}s\nAvg per move: ${(avgTime / 1000).toFixed(2)}s\nWrong moves: ${state.stats.wrongMoveCount}`)
  }

  const markerMap = Array(19).fill(null).map(() => Array(19).fill(null))
  const paintMap = Array(19).fill(null).map(() => Array(19).fill(null))

  if (lastMove) {
    markerMap[lastMove.y][lastMove.x] = { type: 'circle' }
  }

  if (hintState?.hintType === 'quadrant' && hintState.vertices) {
    hintState.vertices.forEach(([x, y]) => {
      paintMap[y][x] = 1
    })
  }

  if (hintState?.hintType === 'ghost' && hintState.ghostStones) {
    hintState.ghostStones.forEach((ghost, index) => {
      const isEliminated = eliminatedLetters.some(g => g.x === ghost.x && g.y === ghost.y)
      if (!isEliminated) {
        markerMap[ghost.y][ghost.x] = { type: 'label', label: HINT_LETTERS[index] }
      }
    })
  }

  if (hintState?.hintType === 'triangle' && hintState.correctPosition) {
    const { x, y } = hintState.correctPosition
    const sign = colorToSign(hintState.nextColor)
    markerMap[y][x] = { type: 'point' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.leftPanel}>
        <h2 style={styles.phaseName}>Replay Challenge</h2>
        <GameInfo gameInfo={gameInfo} />
      </div>

      <div style={styles.centerPanel}>
        <ProgressBar current={state.replayPosition} total={state.totalMoves} />
        <div style={{
          ...styles.boardContainer,
          ...(borderFlash === 'success' ? styles.borderSuccess : {}),
          ...(borderFlash === 'error' ? styles.borderError : {})
        }}>
          <Goban
            animateStonePlacement={true}
            busy={false}
            fuzzyStonePlacement={true}
            showCoordinates={true}
            signMap={board.signMap}
            markerMap={markerMap}
            paintMap={paintMap}
            vertexSize={34}
            onVertexClick={handleVertexClick}
          />
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.statsBox}>
          <h3 style={styles.statsTitle}>Progress</h3>
          <div style={styles.statRow}>
            <span>Move</span>
            <span>{state.replayPosition} / {state.totalMoves}</span>
          </div>
          <div style={styles.statRow}>
            <span>Correct (1st try)</span>
            <span>{state.stats.correctFirstTry}</span>
          </div>
          <div style={styles.statRow}>
            <span>Wrong attempts</span>
            <span>{state.stats.wrongMoveCount}</span>
          </div>
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
  borderSuccess: {
    boxShadow: '0 0 0 4px #4CAF50',
    borderRadius: '4px'
  },
  borderError: {
    boxShadow: '0 0 0 4px #f44336',
    borderRadius: '4px'
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
