import React, { useState } from 'react'
import { parseSGFToMoves, getBoardSize, getGameInfo } from './lib/sgf-parser.js'
import GameController from './game/GameController'
import UploadPhase from './components/UploadPhase.jsx'
import StudyPhase from './components/StudyPhase.jsx'
import ReplayPhase from './components/ReplayPhase.jsx'
import styles from './App.module.css'

function GameWrapper({ moves, boardSize, gameInfo, onGoHome }) {
  const gameManager = GameController(moves, boardSize)
  const state = gameManager.getState()

  if (state.phase === 'study') {
    return <StudyPhase gameManager={gameManager} gameInfo={gameInfo} />
  }

  if (state.phase === 'replay' || state.phase === 'complete') {
    return <ReplayPhase gameManager={gameManager} gameInfo={gameInfo} onGoHome={onGoHome} />
  }

  return null
}

export default function App() {
  const [moves, setMoves] = useState(null)
  const [boardSize, setBoardSize] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)
  const [error, setError] = useState(null)

  const handleFileLoaded = (sgfContent) => {
    try {
      const size = getBoardSize(sgfContent)
      const parsedMoves = parseSGFToMoves(sgfContent)

      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      setMoves(parsedMoves)
      setBoardSize(size)
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

  const handleGoHome = () => {
    setMoves(null)
    setBoardSize(null)
    setGameInfo(null)
  }

  if (!moves) {
    return <UploadPhase onFileLoaded={handleFileLoaded} />
  }

  return <GameWrapper moves={moves} boardSize={boardSize} gameInfo={gameInfo} onGoHome={handleGoHome} />
}
