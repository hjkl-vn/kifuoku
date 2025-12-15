import { useState } from 'react'
import { parseSGFToMoves, getBoardSize, getGameInfo } from './lib/sgf-parser.js'
import useGameManager from './game/useGameManager'
import UploadPhase from './components/UploadPhase.jsx'
import StudyPhase from './components/StudyPhase.jsx'
import ReplayPhase from './components/ReplayPhase.jsx'
import styles from './App.module.css'

function GameWrapper({ moves, gameInfo }) {
  const gameManager = useGameManager(moves)
  const state = gameManager.getState()

  if (state.phase === 'study') {
    return <StudyPhase gameManager={gameManager} gameInfo={gameInfo} />
  }

  if (state.phase === 'replay') {
    return <ReplayPhase gameManager={gameManager} gameInfo={gameInfo} />
  }

  if (state.phase === 'complete') {
    const totalTime = Date.now() - state.stats.startTime
    const avgTime = state.totalMoves > 0 ? totalTime / state.totalMoves : 0

    return (
      <div className={styles.completeContainer}>
        <h1>Game Complete!</h1>
        <div className={styles.statsSection}>
          <p>Total Time: {(totalTime / 1000).toFixed(1)}s</p>
          <p>Average Time per Move: {(avgTime / 1000).toFixed(2)}s</p>
          <p>Wrong Moves: {state.stats.wrongMoveCount}</p>
        </div>
      </div>
    )
  }

  return null
}

export default function App() {
  const [moves, setMoves] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)
  const [error, setError] = useState(null)

  const handleFileLoaded = (sgfContent) => {
    try {
      const boardSize = getBoardSize(sgfContent)
      if (boardSize !== 19) {
        setError('Only 19×19 boards are supported')
        return
      }

      const parsedMoves = parseSGFToMoves(sgfContent)
      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      setMoves(parsedMoves)
      setGameInfo(getGameInfo(sgfContent))
      setError(null)
    } catch (err) {
      setError(`Failed to load game: ${err.message}`)
    }
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    )
  }

  if (!moves) {
    return <UploadPhase onFileLoaded={handleFileLoaded} />
  }

  return <GameWrapper moves={moves} gameInfo={gameInfo} />
}
