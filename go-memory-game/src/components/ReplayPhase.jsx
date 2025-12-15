import { useState } from 'react'
import { Goban } from '@sabaki/shudan'
import ProgressBar from './ProgressBar'
import GameInfo from './GameInfo'
import { createEmptyBoardMap } from '../game/board-utils'
import layout from '../styles/layout.module.css'
import styles from './ReplayPhase.module.css'

const HINT_LETTERS = ['A', 'B', 'C', 'D']

export default function ReplayPhase({ gameManager, gameInfo }) {
  const [hintState, setHintState] = useState(null)
  const [eliminatedLetters, setEliminatedLetters] = useState([])
  const [borderFlash, setBorderFlash] = useState(null)

  const state = gameManager.getState()
  const board = gameManager.getCurrentBoard()
  const lastMove = gameManager.getLastMove()

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
    } else if (result.needHint) {
      setHintState(result)
      setEliminatedLetters([])
      setBorderFlash('error')
      setTimeout(() => setBorderFlash(null), 500)
    }
  }

  const markerMap = createEmptyBoardMap()
  const paintMap = createEmptyBoardMap()

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
    markerMap[y][x] = { type: 'point' }
  }

  const boardContainerClass = [
    layout.boardContainer,
    borderFlash === 'success' ? styles.borderSuccess : '',
    borderFlash === 'error' ? styles.borderError : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={layout.container}>
      <div className={layout.leftPanel}>
        {/* <h2 className={layout.phaseName}>Replay Challenge</h2> */}
        <GameInfo gameInfo={gameInfo} />
      </div>

      <div className={layout.centerPanel}>
        <ProgressBar current={state.replayPosition} total={state.totalMoves} />
        <div className={boardContainerClass}>
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

      <div className={layout.rightPanel}>
        <div className={layout.statsBox}>
          <h3 className={layout.phaseName}>Replay</h3>
          <div className={layout.statRow}>
            <span>Correct (1st try)</span>
            <span>{state.stats.correctFirstTry}</span>
          </div>
          <div className={layout.statRow}>
            <span>Wrong attempts</span>
            <span>{state.stats.wrongMoveCount}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
