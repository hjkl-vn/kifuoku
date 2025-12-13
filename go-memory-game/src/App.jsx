import React, { useState, useEffect } from 'react'
import { initLua, loadLuaCode, callLuaFunction } from './lib/lua-bridge.js'
import { parseSGFToMoves, getBoardSize } from './lib/sgf-parser.js'
import UploadPhase from './components/UploadPhase.jsx'
import StudyPhase from './components/StudyPhase.jsx'
import ReplayPhase from './components/ReplayPhase.jsx'
import initLuaCode from './lua/init.lua?raw'
import gameStateLuaCode from './lua/game-state.lua?raw'

export default function App() {
  const [luaReady, setLuaReady] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [error, setError] = useState(null)

  // Initialize Lua on mount
  useEffect(() => {
    async function setupLua() {
      try {
        await initLua()

        // Load Lua files (imported as raw strings)
        loadLuaCode(gameStateLuaCode)
        loadLuaCode(initLuaCode)

        setLuaReady(true)
      } catch (err) {
        setError(`Lua initialization failed: ${err.message}`)
      }
    }

    setupLua()
  }, [])

  const handleFileLoaded = (sgfContent) => {
    try {
      // Parse SGF
      const boardSize = getBoardSize(sgfContent)
      if (boardSize !== 19) {
        setError('Only 19×19 boards are supported')
        return
      }

      const moves = parseSGFToMoves(sgfContent)
      if (moves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      console.log('Parsed moves:', moves.length)

      // Initialize game in Lua
      console.log('Calling initGame...')
      const result = callLuaFunction('initGame', moves)
      console.log('initGame result:', result)

      console.log('Calling getGameState...')
      const state = callLuaFunction('getGameState')
      console.log('getGameState result:', state)

      setGameState(state)
      setError(null)

    } catch (err) {
      console.error('Error in handleFileLoaded:', err)
      setError(`Failed to load game: ${err.message}`)
    }
  }

  const refreshGameState = () => {
    const newState = callLuaFunction('getGameState')
    setGameState(newState)
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    )
  }

  if (!luaReady) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading game engine...</p>
      </div>
    )
  }

  // Phase routing
  if (!gameState || gameState.phase === 'upload') {
    return <UploadPhase onFileLoaded={handleFileLoaded} />
  }

  // Debug: Log current game state
  console.log('Current gameState:', gameState)

  if (gameState.phase === 'study') {
    return <StudyPhase gameState={gameState} />
  }

  if (gameState.phase === 'replay') {
    return <ReplayPhase gameState={gameState} onComplete={refreshGameState} />
  }

  if (gameState.phase === 'complete') {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Game Complete!</h2>
        <p>Stats will appear here (next task)</p>
      </div>
    )
  }

  // Placeholder for other phases
  return (
    <div style={{ padding: '20px' }}>
      <p>Current phase: {gameState.phase}</p>
      <p>Total moves: {gameState.totalMoves}</p>
    </div>
  )
}
