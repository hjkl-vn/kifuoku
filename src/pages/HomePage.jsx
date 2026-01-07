import { useState, useRef, useCallback, useEffect } from 'react'
import { parseSGFToMoves, getBoardSize, getGameInfo } from '../lib/sgfParser.js'
import useGameController from '../game/useGameController'
import UploadPhase from '../components/UploadPhase.jsx'
import StudyPhase from '../components/StudyPhase.jsx'
import ReplayPhase from '../components/ReplayPhase.jsx'
import styles from '../styles/HomePage.module.css'

const STONE_SOUNDS = [0, 1, 2, 3, 4].map((i) => `/sounds/stone${i}.mp3`)

function GameWrapper({ moves, boardSize, gameInfo, onGoHome }) {
  const audioRefs = useRef([])
  const lastIndexRef = useRef(-1)

  useEffect(() => {
    const audios = STONE_SOUNDS.map((src) => {
      const audio = new Audio(src)
      audio.preload = 'auto'
      return audio
    })
    audioRefs.current = audios
    return () => {
      audios.forEach((audio) => {
        audio.pause()
        audio.src = ''
      })
    }
  }, [])

  const playStoneSound = useCallback(() => {
    const sounds = audioRefs.current
    if (sounds.length === 0) return

    let index = 0
    if (sounds.length > 1) {
      index = lastIndexRef.current
      while (index === lastIndexRef.current) {
        index = Math.floor(Math.random() * sounds.length)
      }
      lastIndexRef.current = index
    }

    sounds[index].currentTime = 0
    sounds[index].play().catch(() => {})
  }, [])

  const gameManager = useGameController(moves, boardSize, { onStonePlace: playStoneSound })
  const state = gameManager.getState()

  if (state.phase === 'study') {
    return <StudyPhase gameManager={gameManager} gameInfo={gameInfo} />
  }

  if (state.phase === 'replay' || state.phase === 'complete') {
    return <ReplayPhase gameManager={gameManager} gameInfo={gameInfo} onGoHome={onGoHome} />
  }

  return null
}

export default function HomePage() {
  const [moves, setMoves] = useState(null)
  const [boardSize, setBoardSize] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)
  const [error, setError] = useState(null)

  const handleFileLoaded = (sgfContent, sourceUrl = null) => {
    try {
      const size = getBoardSize(sgfContent)
      const parsedMoves = parseSGFToMoves(sgfContent)

      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      const info = getGameInfo(sgfContent)
      if (sourceUrl && !info.sourceUrl) {
        info.sourceUrl = sourceUrl
      }

      setMoves(parsedMoves)
      setBoardSize(size)
      setGameInfo(info)
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
        <button onClick={() => setError(null)} className={styles.retryButton}>
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

  return (
    <GameWrapper moves={moves} boardSize={boardSize} gameInfo={gameInfo} onGoHome={handleGoHome} />
  )
}
