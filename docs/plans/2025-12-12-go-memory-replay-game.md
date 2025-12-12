# Go Memory Replay Game Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a web app where players study a Go game from SGF and replay moves from memory with progressive hints.

**Architecture:** React UI renders Shudan goban, Fengari runs Lua game logic in browser, SGF parser feeds move data to Lua. Four phases: upload SGF → study with prev/next → replay with validation → stats screen. Wrong moves trigger 4-option multiple choice hints with ghost stones.

**Tech Stack:** Vite, React, Fengari (Lua VM), Shudan (goban), @sabaki/sgf (parser), Lua 5.3

---

## Task 1: Project Setup and Dependencies

**Files:**
- Create: `go-memory-game/package.json`
- Create: `go-memory-game/vite.config.js`
- Create: `go-memory-game/index.html`
- Create: `go-memory-game/.gitignore`

**Step 1: Create project directory**

```bash
cd /home/csessh/Documents/covay
mkdir go-memory-game
cd go-memory-game
```

**Step 2: Initialize package.json**

Create: `package.json`

```json
{
  "name": "go-memory-game",
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@sabaki/shudan": "^1.7.1",
    "@sabaki/sgf": "^4.3.4",
    "fengari-web": "^0.1.4"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.12"
  }
}
```

**Step 3: Create Vite config**

Create: `vite.config.js`

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'preact': 'react',
      'preact/hooks': 'react'
    }
  },
  server: {
    port: 3000
  }
})
```

**Step 4: Create HTML entry point**

Create: `index.html`

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Go Memory Replay Game</title>
    <link rel="stylesheet" href="./node_modules/@sabaki/shudan/css/goban.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 5: Create .gitignore**

Create: `.gitignore`

```
node_modules
dist
*.log
.DS_Store
```

**Step 6: Install dependencies**

```bash
npm install
```

Expected: All packages installed successfully

**Step 7: Create source directory structure**

```bash
mkdir -p src/lua
mkdir -p src/components
mkdir -p src/lib
```

**Step 8: Commit initial setup**

```bash
git init
git add .
git commit -m "feat: initial project setup with Vite and dependencies"
```

---

## Task 2: Fengari Lua Bridge Setup

**Files:**
- Create: `src/lib/lua-bridge.js`
- Create: `src/lua/init.lua`
- Test: Manual browser test

**Step 1: Write Lua bridge interface**

Create: `src/lib/lua-bridge.js`

```javascript
import * as fengari from 'fengari-web'

let lua = null
let luaGlobal = null

export async function initLua() {
  if (lua) return lua

  // Create Lua state
  lua = fengari.lauxlib.luaL_newstate()
  fengari.lualib.luaL_openlibs(lua)

  // Helper to get global
  luaGlobal = {
    get: (name) => {
      fengari.lua.lua_getglobal(lua, fengari.to_luastring(name))
      const value = fengari.interop.tojs(lua, -1)
      fengari.lua.lua_pop(lua, 1)
      return value
    },
    set: (name, value) => {
      fengari.interop.push(lua, value)
      fengari.lua.lua_setglobal(lua, fengari.to_luastring(name))
    }
  }

  return { lua, luaGlobal }
}

export function loadLuaCode(code) {
  if (!lua) throw new Error('Lua not initialized')

  const result = fengari.lauxlib.luaL_dostring(
    lua,
    fengari.to_luastring(code)
  )

  if (result !== fengari.lua.LUA_OK) {
    const error = fengari.lua.lua_tojsstring(lua, -1)
    fengari.lua.lua_pop(lua, 1)
    throw new Error(`Lua error: ${error}`)
  }
}

export function callLuaFunction(functionName, ...args) {
  if (!lua) throw new Error('Lua not initialized')

  fengari.lua.lua_getglobal(lua, fengari.to_luastring(functionName))

  // Push arguments
  args.forEach(arg => fengari.interop.push(lua, arg))

  // Call function
  const result = fengari.lua.lua_pcall(lua, args.length, 1, 0)

  if (result !== fengari.lua.LUA_OK) {
    const error = fengari.lua.lua_tojsstring(lua, -1)
    fengari.lua.lua_pop(lua, 1)
    throw new Error(`Lua error: ${error}`)
  }

  // Get result
  const returnValue = fengari.interop.tojs(lua, -1)
  fengari.lua.lua_pop(lua, 1)

  return returnValue
}

export function getLuaGlobal(name) {
  return luaGlobal ? luaGlobal.get(name) : null
}

export function setLuaGlobal(name, value) {
  if (luaGlobal) luaGlobal.set(name, value)
}
```

**Step 2: Create initial Lua test file**

Create: `src/lua/init.lua`

```lua
-- Test function to verify Lua is working
function hello(name)
  return "Hello from Lua, " .. name .. "!"
end

-- Initialize game state namespace
GameState = {}

function GameState.new()
  local self = {}
  self.phase = "init"
  return self
end

print("Lua initialized successfully")
```

**Step 3: Create test React component**

Create: `src/main.jsx`

```jsx
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { initLua, loadLuaCode, callLuaFunction } from './lib/lua-bridge.js'

function App() {
  const [luaMessage, setLuaMessage] = useState('Initializing Lua...')

  useEffect(() => {
    async function setupLua() {
      try {
        await initLua()

        // Load Lua code
        const response = await fetch('/src/lua/init.lua')
        const luaCode = await response.text()
        loadLuaCode(luaCode)

        // Test Lua function
        const message = callLuaFunction('hello', 'React')
        setLuaMessage(message)
      } catch (error) {
        setLuaMessage(`Error: ${error.message}`)
      }
    }

    setupLua()
  }, [])

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Go Memory Replay Game</h1>
      <p>{luaMessage}</p>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

**Step 4: Test in browser**

```bash
npm run dev
```

Expected: Browser shows "Hello from Lua, React!" and console shows "Lua initialized successfully"

**Step 5: Commit Lua bridge**

```bash
git add src/lib/lua-bridge.js src/lua/init.lua src/main.jsx
git commit -m "feat: add Fengari Lua bridge and test integration"
```

---

## Task 3: SGF Parser Integration

**Files:**
- Create: `src/lib/sgf-parser.js`
- Test: Manual test with sample SGF

**Step 1: Write SGF parser wrapper**

Create: `src/lib/sgf-parser.js`

```javascript
import { parse } from '@sabaki/sgf'

/**
 * Parse SGF file content to move list
 * @param {string} sgfContent - Raw SGF file content
 * @returns {Array} Array of moves: [{x, y, color, moveNumber}, ...]
 */
export function parseSGFToMoves(sgfContent) {
  try {
    const gameTree = parse(sgfContent)

    if (!gameTree || gameTree.length === 0) {
      throw new Error('Invalid SGF: no game tree found')
    }

    const rootNode = gameTree[0]
    const moves = []
    let moveNumber = 0

    // Traverse game tree depth-first
    function traverseNode(node) {
      if (!node) return

      // Check for move (B or W property)
      const blackMove = node.data.B
      const whiteMove = node.data.W

      if (blackMove) {
        const [x, y] = parseSGFCoordinate(blackMove[0])
        if (x !== null && y !== null) {
          moveNumber++
          moves.push({ x, y, color: 'B', moveNumber })
        }
      }

      if (whiteMove) {
        const [x, y] = parseSGFCoordinate(whiteMove[0])
        if (x !== null && y !== null) {
          moveNumber++
          moves.push({ x, y, color: 'W', moveNumber })
        }
      }

      // Continue with first child
      if (node.children && node.children.length > 0) {
        traverseNode(node.children[0])
      }
    }

    traverseNode(rootNode)

    return moves
  } catch (error) {
    throw new Error(`SGF parsing failed: ${error.message}`)
  }
}

/**
 * Convert SGF coordinate string to [x, y]
 * SGF uses lowercase letters: 'a' = 0, 'b' = 1, etc.
 * Empty string or 'tt' means pass, return [null, null]
 */
function parseSGFCoordinate(coord) {
  if (!coord || coord === '' || coord === 'tt') {
    return [null, null]
  }

  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0)

  return [x, y]
}

/**
 * Get board size from SGF
 */
export function getBoardSize(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]

    if (rootNode.data.SZ) {
      return parseInt(rootNode.data.SZ[0])
    }

    return 19 // Default
  } catch (error) {
    return 19
  }
}
```

**Step 2: Create test SGF file**

Create: `public/test-game.sgf`

```
(;GM[1]FF[4]SZ[19]
;B[pd];W[dp];B[pq];W[dd];B[fq];W[cn];B[jp];W[qo])
```

**Step 3: Test parser in main.jsx**

Modify: `src/main.jsx` (add after Lua test):

```jsx
import { parseSGFToMoves, getBoardSize } from './lib/sgf-parser.js'

// Inside setupLua function, after Lua test:
const testSGF = await fetch('/test-game.sgf').then(r => r.text())
const moves = parseSGFToMoves(testSGF)
const boardSize = getBoardSize(testSGF)
console.log(`Parsed ${moves.length} moves from SGF, board size: ${boardSize}`)
console.log('First 3 moves:', moves.slice(0, 3))
```

**Step 4: Test SGF parsing**

```bash
npm run dev
```

Expected: Console shows "Parsed 8 moves from SGF, board size: 19" and first 3 moves

**Step 5: Commit SGF parser**

```bash
git add src/lib/sgf-parser.js public/test-game.sgf src/main.jsx
git commit -m "feat: add SGF parser integration with test file"
```

---

## Task 4: Lua Game State Core Structure

**Files:**
- Create: `src/lua/game-state.lua`
- Test: Call from React and verify state

**Step 1: Write Lua game state module**

Create: `src/lua/game-state.lua`

```lua
-- Game State Management for Go Memory Replay
GameState = GameState or {}

function GameState.new()
  local self = {
    -- Game data
    correctMoves = {},
    boardSize = 19,

    -- Current phase
    phase = "upload", -- "upload" | "study" | "replay" | "complete"

    -- Study phase
    studyPosition = 0, -- 0 means no moves shown yet

    -- Replay phase
    currentMoveIndex = 1,
    playerMoves = {},
    wrongMoveCount = 0,
    correctFirstTry = 0,

    -- Timing
    startTime = 0,
    moveTimes = {},

    -- Board state (for rendering)
    boardState = {}
  }

  -- Initialize empty board
  for y = 0, 18 do
    self.boardState[y] = {}
    for x = 0, 18 do
      self.boardState[y][x] = 0
    end
  end

  return self
end

function GameState.loadGame(self, moves)
  self.correctMoves = moves
  self.phase = "study"
  self.studyPosition = 0

  return {
    success = true,
    phase = "study",
    totalMoves = #moves
  }
end

function GameState.getState(self)
  return {
    phase = self.phase,
    studyPosition = self.studyPosition,
    currentMoveIndex = self.currentMoveIndex,
    totalMoves = #self.correctMoves,
    boardState = self.boardState,
    wrongMoveCount = self.wrongMoveCount,
    correctFirstTry = self.correctFirstTry
  }
end

-- Utility: Convert color string to sign
function GameState.colorToSign(color)
  if color == "B" then return 1
  elseif color == "W" then return -1
  else return 0
  end
end

-- Utility: Update board state with move
function GameState.applyMove(self, x, y, color)
  local sign = GameState.colorToSign(color)
  if self.boardState[y] then
    self.boardState[y][x] = sign
  end
end

-- For debugging
function GameState.toString(self)
  return string.format(
    "GameState{phase=%s, moves=%d, studyPos=%d}",
    self.phase,
    #self.correctMoves,
    self.studyPosition
  )
end

-- Return module
return GameState
```

**Step 2: Update init.lua to load game-state.lua**

Modify: `src/lua/init.lua`

```lua
-- Load game state module
dofile("src/lua/game-state.lua")

-- Create global game instance
game = GameState.new()

-- Expose functions for React to call
function initGame(movesJSON)
  -- movesJSON is a JSON string from JavaScript
  -- Fengari will convert it to Lua table
  return game:loadGame(movesJSON)
end

function getGameState()
  return game:getState()
end

print("Lua game engine initialized")
```

**Step 3: Test from React**

Modify: `src/main.jsx` (update test):

```jsx
// After loading init.lua and test-game.sgf:
const moves = parseSGFToMoves(testSGF)

// Pass moves to Lua
const initResult = callLuaFunction('initGame', moves)
console.log('Game initialized:', initResult)

// Get state back
const gameState = callLuaFunction('getGameState')
console.log('Game state:', gameState)
```

**Step 4: Test game state**

```bash
npm run dev
```

Expected: Console shows game initialized with 8 moves, phase "study"

**Step 5: Commit game state core**

```bash
git add src/lua/game-state.lua src/lua/init.lua src/main.jsx
git commit -m "feat: add Lua game state core structure"
```

---

## Task 5: Upload Phase UI Component

**Files:**
- Create: `src/components/UploadPhase.jsx`
- Create: `src/App.jsx`
- Modify: `src/main.jsx`

**Step 1: Create upload component**

Create: `src/components/UploadPhase.jsx`

```jsx
import React, { useState } from 'react'

export default function UploadPhase({ onFileLoaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    setError(null)

    if (!file.name.endsWith('.sgf')) {
      setError('Please upload a .sgf file')
      return
    }

    try {
      const text = await file.text()
      onFileLoaded(text)
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Go Memory Replay Game</h1>

      <div
        style={{
          ...styles.dropZone,
          ...(dragOver ? styles.dropZoneActive : {})
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
      >
        <p style={styles.dropText}>
          Drop SGF file here
        </p>
        <p style={styles.orText}>or</p>
        <label style={styles.button}>
          Choose File
          <input
            type="file"
            accept=".sgf"
            onChange={handleFileInput}
            style={styles.fileInput}
          />
        </label>
      </div>

      {error && (
        <p style={styles.error}>{error}</p>
      )}

      <div style={styles.info}>
        <p><strong>How to play:</strong></p>
        <ol>
          <li>Upload a Go game (SGF format, 19×19 only)</li>
          <li>Study the game using prev/next buttons</li>
          <li>Replay moves from memory</li>
          <li>Get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '50px auto',
    padding: '20px',
    fontFamily: 'sans-serif'
  },
  title: {
    textAlign: 'center',
    fontSize: '32px',
    marginBottom: '30px'
  },
  dropZone: {
    border: '3px dashed #ccc',
    borderRadius: '10px',
    padding: '60px 20px',
    textAlign: 'center',
    backgroundColor: '#f9f9f9',
    transition: 'all 0.2s'
  },
  dropZoneActive: {
    borderColor: '#4CAF50',
    backgroundColor: '#e8f5e9'
  },
  dropText: {
    fontSize: '18px',
    color: '#666',
    margin: '0 0 10px 0'
  },
  orText: {
    fontSize: '14px',
    color: '#999',
    margin: '10px 0'
  },
  button: {
    display: 'inline-block',
    padding: '12px 30px',
    backgroundColor: '#4CAF50',
    color: 'white',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: 'bold',
    transition: 'background-color 0.2s'
  },
  fileInput: {
    display: 'none'
  },
  error: {
    color: '#f44336',
    textAlign: 'center',
    marginTop: '20px',
    fontSize: '14px'
  },
  info: {
    marginTop: '40px',
    padding: '20px',
    backgroundColor: '#e3f2fd',
    borderRadius: '5px',
    fontSize: '14px',
    lineHeight: '1.6'
  }
}
```

**Step 2: Create main App component**

Create: `src/App.jsx`

```jsx
import React, { useState, useEffect } from 'react'
import { initLua, loadLuaCode, callLuaFunction } from './lib/lua-bridge.js'
import { parseSGFToMoves, getBoardSize } from './lib/sgf-parser.js'
import UploadPhase from './components/UploadPhase.jsx'

export default function App() {
  const [luaReady, setLuaReady] = useState(false)
  const [gameState, setGameState] = useState(null)
  const [error, setError] = useState(null)

  // Initialize Lua on mount
  useEffect(() => {
    async function setupLua() {
      try {
        await initLua()

        // Load Lua files
        const initLua = await fetch('/src/lua/init.lua').then(r => r.text())
        const gameStateLua = await fetch('/src/lua/game-state.lua').then(r => r.text())

        loadLuaCode(gameStateLua)
        loadLuaCode(initLua)

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

      // Initialize game in Lua
      const result = callLuaFunction('initGame', moves)
      const state = callLuaFunction('getGameState')

      setGameState(state)
      setError(null)

    } catch (err) {
      setError(`Failed to load game: ${err.message}`)
    }
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

  // Placeholder for other phases
  return (
    <div style={{ padding: '20px' }}>
      <p>Current phase: {gameState.phase}</p>
      <p>Total moves: {gameState.totalMoves}</p>
    </div>
  )
}
```

**Step 3: Update main.jsx**

Modify: `src/main.jsx`

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(<App />)
```

**Step 4: Test upload phase**

```bash
npm run dev
```

Expected: See upload UI, drag/drop or select test-game.sgf, see "Current phase: study"

**Step 5: Commit upload phase**

```bash
git add src/components/UploadPhase.jsx src/App.jsx src/main.jsx
git commit -m "feat: add upload phase UI component"
```

---

## Task 6: Study Phase - Navigation Logic

**Files:**
- Modify: `src/lua/game-state.lua` (add study functions)
- Create: `src/components/StudyPhase.jsx`

**Step 1: Add study navigation to Lua**

Modify: `src/lua/game-state.lua` (add these functions):

```lua
-- Study Phase: Move forward
function GameState.nextMove(self)
  if self.phase ~= "study" then
    return { error = "Not in study phase" }
  end

  if self.studyPosition < #self.correctMoves then
    self.studyPosition = self.studyPosition + 1

    -- Apply move to board
    local move = self.correctMoves[self.studyPosition]
    self:applyMove(move.x, move.y, move.color)

    return {
      success = true,
      position = self.studyPosition,
      move = move,
      boardState = self.boardState
    }
  end

  return { atEnd = true, position = self.studyPosition }
end

-- Study Phase: Move backward
function GameState.prevMove(self)
  if self.phase ~= "study" then
    return { error = "Not in study phase" }
  end

  if self.studyPosition > 0 then
    -- Remove stone from board
    local move = self.correctMoves[self.studyPosition]
    self.boardState[move.y][move.x] = 0

    self.studyPosition = self.studyPosition - 1

    return {
      success = true,
      position = self.studyPosition,
      boardState = self.boardState
    }
  end

  return { atStart = true, position = 0 }
end

-- Study Phase: Start replay
function GameState.startReplay(self)
  if self.phase ~= "study" then
    return { error = "Not in study phase" }
  end

  -- Reset board
  for y = 0, 18 do
    for x = 0, 18 do
      self.boardState[y][x] = 0
    end
  end

  self.phase = "replay"
  self.currentMoveIndex = 1
  self.startTime = os.time()
  self.playerMoves = {}
  self.wrongMoveCount = 0
  self.correctFirstTry = 0
  self.moveTimes = {}

  return {
    success = true,
    phase = "replay",
    boardState = self.boardState
  }
end
```

**Step 2: Add Lua functions to init.lua**

Modify: `src/lua/init.lua` (add these exports):

```lua
function studyNext()
  return game:nextMove()
end

function studyPrev()
  return game:prevMove()
end

function beginReplay()
  return game:startReplay()
end
```

**Step 3: Create StudyPhase component**

Create: `src/components/StudyPhase.jsx`

```jsx
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
          vertexSize={28}
          signMap={state.boardState}
          showCoordinates={true}
          busy={true}
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
```

**Step 4: Integrate StudyPhase in App.jsx**

Modify: `src/App.jsx` (update phase routing):

```jsx
import StudyPhase from './components/StudyPhase.jsx'

// In the component, replace the placeholder with:
if (gameState.phase === 'study') {
  return <StudyPhase gameState={gameState} />
}
```

**Step 5: Test study phase**

```bash
npm run dev
```

Expected: Upload SGF, navigate with prev/next, see stones appear/disappear, click "Start Replay Challenge"

**Step 6: Commit study phase**

```bash
git add src/lua/game-state.lua src/lua/init.lua src/components/StudyPhase.jsx src/App.jsx
git commit -m "feat: add study phase with navigation controls"
```

---

## Task 7: Replay Phase - Move Validation

**Files:**
- Modify: `src/lua/game-state.lua` (add validation)
- Create: `src/components/ReplayPhase.jsx`

**Step 1: Add move validation to Lua**

Modify: `src/lua/game-state.lua` (add this function):

```lua
-- Replay Phase: Validate player move
function GameState.validateMove(self, x, y)
  if self.phase ~= "replay" then
    return { error = "Not in replay phase" }
  end

  if self.currentMoveIndex > #self.correctMoves then
    return { error = "All moves completed" }
  end

  local correctMove = self.correctMoves[self.currentMoveIndex]
  local isCorrect = (correctMove.x == x and correctMove.y == y)

  if isCorrect then
    -- Correct move!
    self.correctFirstTry = self.correctFirstTry + 1
    self:applyMove(x, y, correctMove.color)

    -- Track timing (simplified for now)
    table.insert(self.moveTimes, 0)

    self.currentMoveIndex = self.currentMoveIndex + 1

    -- Check if game complete
    if self.currentMoveIndex > #self.correctMoves then
      self.phase = "complete"
      return {
        correct = true,
        gameComplete = true,
        boardState = self.boardState
      }
    end

    return {
      correct = true,
      needHint = false,
      currentMove = self.currentMoveIndex,
      boardState = self.boardState
    }
  else
    -- Wrong move - will trigger hint
    self.wrongMoveCount = self.wrongMoveCount + 1

    return {
      correct = false,
      needHint = true,
      wrongMove = {x = x, y = y}
    }
  end
end
```

**Step 2: Add to init.lua**

Modify: `src/lua/init.lua`:

```lua
function replayMove(x, y)
  return game:validateMove(x, y)
end
```

**Step 3: Create ReplayPhase component (basic)**

Create: `src/components/ReplayPhase.jsx`

```jsx
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
```

**Step 4: Integrate ReplayPhase in App.jsx**

Modify: `src/App.jsx`:

```jsx
import ReplayPhase from './components/ReplayPhase.jsx'

// Add state refresh function
const refreshGameState = () => {
  const newState = callLuaFunction('getGameState')
  setGameState(newState)
}

// In phase routing:
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
```

**Step 5: Test replay validation**

```bash
npm run dev
```

Expected: Upload, study, start replay, click correct positions to place stones, wrong clicks show error

**Step 6: Commit replay validation**

```bash
git add src/lua/game-state.lua src/lua/init.lua src/components/ReplayPhase.jsx src/App.jsx
git commit -m "feat: add replay phase with move validation"
```

---

## Task 8: Hint System - Lua Logic

**Files:**
- Modify: `src/lua/game-state.lua` (add hint generation)

**Step 1: Add hint generation function**

Modify: `src/lua/game-state.lua` (add these functions):

```lua
-- Generate hint options (1 correct + 3 nearby random)
function GameState.generateHints(self)
  if self.currentMoveIndex > #self.correctMoves then
    return {}
  end

  local correctMove = self.correctMoves[self.currentMoveIndex]
  local options = {
    {
      x = correctMove.x,
      y = correctMove.y,
      isCorrect = true,
      moveNumber = self.currentMoveIndex
    }
  }

  -- Generate 3 random nearby positions
  local attempts = 0
  local maxAttempts = 100

  while #options < 4 and attempts < maxAttempts do
    -- Random offset from correct position (-4 to +4)
    local dx = math.random(-4, 4)
    local dy = math.random(-4, 4)

    -- Skip if no offset
    if dx ~= 0 or dy ~= 0 then
      local newX = correctMove.x + dx
      local newY = correctMove.y + dy

      -- Check if valid position
      if self:isValidHintPosition(newX, newY, options) then
        table.insert(options, {
          x = newX,
          y = newY,
          isCorrect = false,
          moveNumber = self.currentMoveIndex
        })
      end
    end

    attempts = attempts + 1
  end

  return options
end

-- Check if position is valid for hint
function GameState.isValidHintPosition(self, x, y, existingOptions)
  -- Must be on board
  if x < 0 or x > 18 or y < 0 or y > 18 then
    return false
  end

  -- Must be empty
  if self.boardState[y][x] ~= 0 then
    return false
  end

  -- Must not be duplicate
  for _, opt in ipairs(existingOptions) do
    if opt.x == x and opt.y == y then
      return false
    end
  end

  return true
end

-- Handle hint selection
function GameState.selectHint(self, x, y)
  if self.phase ~= "replay" then
    return { error = "Not in replay phase" }
  end

  local correctMove = self.correctMoves[self.currentMoveIndex]

  if correctMove.x == x and correctMove.y == y then
    -- Correct hint selected
    self:applyMove(x, y, correctMove.color)
    table.insert(self.moveTimes, 0)

    self.currentMoveIndex = self.currentMoveIndex + 1

    -- Check if complete
    if self.currentMoveIndex > #self.correctMoves then
      self.phase = "complete"
      return {
        correct = true,
        gameComplete = true,
        boardState = self.boardState
      }
    end

    return {
      correct = true,
      currentMove = self.currentMoveIndex,
      boardState = self.boardState
    }
  else
    -- Wrong hint - increment wrong count again
    self.wrongMoveCount = self.wrongMoveCount + 1

    return {
      correct = false,
      message = "Wrong choice, try again"
    }
  end
end
```

**Step 2: Update validateMove to return hints**

Modify: `src/lua/game-state.lua` in `validateMove` function where it returns wrong move:

```lua
else
  -- Wrong move - generate hints
  self.wrongMoveCount = self.wrongMoveCount + 1

  local hints = self:generateHints()

  return {
    correct = false,
    needHint = true,
    wrongMove = {x = x, y = y},
    hintOptions = hints
  }
end
```

**Step 3: Add hint function to init.lua**

Modify: `src/lua/init.lua`:

```lua
function selectHint(x, y)
  return game:selectHint(x, y)
end
```

**Step 4: Test hint generation in console**

Add temporary test in `src/App.jsx`:

```jsx
// In handleFileLoaded after initializing game:
window.testHints = () => {
  // Force wrong move
  const result = callLuaFunction('replayMove', 0, 0)
  console.log('Hint options:', result.hintOptions)
}
```

**Step 5: Test hint generation**

```bash
npm run dev
```

In browser console: `testHints()`

Expected: See array with 4 hint options, one marked `isCorrect: true`

**Step 6: Commit hint logic**

```bash
git add src/lua/game-state.lua src/lua/init.lua
git commit -m "feat: add hint generation logic in Lua"
```

---

## Task 9: Hint UI with Ghost Stones

**Files:**
- Create: `src/components/HintOverlay.jsx`
- Modify: `src/components/ReplayPhase.jsx`

**Step 1: Create HintOverlay component**

Create: `src/components/HintOverlay.jsx`

```jsx
import React from 'react'

/**
 * Converts hint options to Shudan ghostStoneMap and markerMap format
 */
export function createHintMaps(hintOptions, nextColor) {
  const ghostStoneMap = []
  const markerMap = []

  // Initialize empty maps (19x19)
  for (let y = 0; y < 19; y++) {
    ghostStoneMap[y] = new Array(19).fill(null)
    markerMap[y] = new Array(19).fill(null)
  }

  // Determine stone sign from color
  const sign = nextColor === 'B' ? 1 : -1

  // Place ghost stones and markers
  hintOptions.forEach(hint => {
    ghostStoneMap[hint.y][hint.x] = {
      sign: sign,
      faint: false
    }

    markerMap[hint.y][hint.x] = {
      type: 'label',
      label: String(hint.moveNumber)
    }
  })

  return { ghostStoneMap, markerMap }
}

export default function HintOverlay({ hintOptions, onSelect, onCancel }) {
  return (
    <div style={styles.overlay}>
      <div style={styles.message}>
        <h3>Choose the correct position</h3>
        <p>Click on one of the highlighted stones</p>
        <p style={styles.hint}>Hint: {hintOptions.length} options shown</p>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: '50px',
    zIndex: 1000
  },
  message: {
    backgroundColor: 'white',
    padding: '30px',
    borderRadius: '10px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textAlign: 'center',
    maxWidth: '400px'
  },
  hint: {
    fontSize: '14px',
    color: '#666',
    marginTop: '10px'
  }
}
```

**Step 2: Update ReplayPhase to use hints**

Modify: `src/components/ReplayPhase.jsx`:

```jsx
import HintOverlay, { createHintMaps } from './HintOverlay.jsx'

// In component state:
const [hintOptions, setHintOptions] = useState(null)
const [hintMaps, setHintMaps] = useState({ ghostStoneMap: null, markerMap: null })

// Update handleVertexClick:
const handleVertexClick = (evt, [x, y]) => {
  if (evt.button !== 0) return

  // If hints are showing, this is a hint selection
  if (hintOptions) {
    const result = callLuaFunction('selectHint', x, y)

    if (result.correct) {
      setState(callLuaFunction('getGameState'))
      setFeedback({ type: 'success', message: 'Correct!' })
      setHintOptions(null)
      setHintMaps({ ghostStoneMap: null, markerMap: null })

      setTimeout(() => setFeedback(null), 1000)

      if (result.gameComplete) {
        setTimeout(() => onComplete(), 1500)
      }
    } else {
      setFeedback({ type: 'error', message: 'Wrong choice! Try again.' })
      setTimeout(() => setFeedback(null), 1500)
    }
    return
  }

  // Normal move validation
  const result = callLuaFunction('replayMove', x, y)

  if (result.correct) {
    setState(callLuaFunction('getGameState'))
    setFeedback({ type: 'success', message: 'Correct!' })
    setTimeout(() => setFeedback(null), 1000)

    if (result.gameComplete) {
      setTimeout(() => onComplete(), 1500)
    }
  } else if (result.needHint) {
    // Get next move color
    const nextColor = (state.currentMoveIndex % 2 === 1) ? 'B' : 'W'

    // Create hint maps for Shudan
    const maps = createHintMaps(result.hintOptions, nextColor)

    setHintOptions(result.hintOptions)
    setHintMaps(maps)
    setFeedback({ type: 'error', message: 'Wrong move!' })
    setTimeout(() => setFeedback(null), 1000)
  }
}

// Update Goban component:
<Goban
  vertexSize={28}
  signMap={state.boardState}
  showCoordinates={true}
  onVertexMouseUp={handleVertexClick}
  ghostStoneMap={hintMaps.ghostStoneMap}
  markerMap={hintMaps.markerMap}
/>

// Replace hint placeholder with:
{hintOptions && (
  <HintOverlay
    hintOptions={hintOptions}
    onSelect={handleVertexClick}
  />
)}
```

**Step 3: Fix next color determination**

We need to get the actual next color from Lua. Modify `src/lua/game-state.lua`:

```lua
-- In validateMove, add to return values:
return {
  correct = false,
  needHint = true,
  wrongMove = {x = x, y = y},
  hintOptions = hints,
  nextColor = correctMove.color  -- Add this
}
```

Update ReplayPhase.jsx:

```jsx
const maps = createHintMaps(result.hintOptions, result.nextColor)
```

**Step 4: Test hint UI**

```bash
npm run dev
```

Expected: Upload, study, replay, click wrong position → see 4 ghost stones with move numbers, click correct one to continue

**Step 5: Commit hint UI**

```bash
git add src/components/HintOverlay.jsx src/components/ReplayPhase.jsx src/lua/game-state.lua
git commit -m "feat: add hint overlay with ghost stones and move numbers"
```

---

## Task 10: Statistics Calculation

**Files:**
- Modify: `src/lua/game-state.lua` (add stats calculation)

**Step 1: Add timing tracking**

Modify: `src/lua/game-state.lua`:

```lua
-- In startReplay function:
function GameState.startReplay(self)
  -- ... existing code ...
  self.startTime = os.time()
  self.lastMoveTime = os.time()  -- Add this
  -- ... rest of code ...
end

-- In validateMove (correct branch):
if isCorrect then
  self.correctFirstTry = self.correctFirstTry + 1
  self:applyMove(x, y, correctMove.color)

  -- Track move time
  local moveTime = os.time() - self.lastMoveTime
  table.insert(self.moveTimes, moveTime)
  self.lastMoveTime = os.time()

  self.currentMoveIndex = self.currentMoveIndex + 1
  -- ... rest of code ...
end

-- In selectHint (correct branch):
if correctMove.x == x and correctMove.y == y then
  self:applyMove(x, y, correctMove.color)

  -- Track move time
  local moveTime = os.time() - self.lastMoveTime
  table.insert(self.moveTimes, moveTime)
  self.lastMoveTime = os.time()

  self.currentMoveIndex = self.currentMoveIndex + 1
  -- ... rest of code ...
end
```

**Step 2: Add statistics calculation function**

Modify: `src/lua/game-state.lua` (add this function):

```lua
-- Calculate final statistics
function GameState.calculateStats(self)
  if self.phase ~= "complete" then
    return { error = "Game not complete" }
  end

  local totalTime = os.time() - self.startTime
  local totalMoves = #self.correctMoves

  -- Calculate average time per move
  local avgTime = 0
  if #self.moveTimes > 0 then
    local sum = 0
    for _, time in ipairs(self.moveTimes) do
      sum = sum + time
    end
    avgTime = sum / #self.moveTimes
  end

  -- Format time (MM:SS)
  local minutes = math.floor(totalTime / 60)
  local seconds = totalTime % 60
  local timeFormatted = string.format("%02d:%02d", minutes, seconds)

  return {
    totalMoves = totalMoves,
    correctFirstTry = self.correctFirstTry,
    wrongAttempts = self.wrongMoveCount,
    totalTime = totalTime,
    totalTimeFormatted = timeFormatted,
    avgTimePerMove = avgTime,
    accuracy = math.floor((self.correctFirstTry / totalMoves) * 100),
    moveTimes = self.moveTimes
  }
end
```

**Step 3: Add to init.lua**

Modify: `src/lua/init.lua`:

```lua
function getStats()
  return game:calculateStats()
end
```

**Step 4: Test stats calculation**

Add to `src/App.jsx` temporarily:

```jsx
// When game is complete:
if (gameState.phase === 'complete') {
  const stats = callLuaFunction('getStats')
  console.log('Final stats:', stats)
  // ... existing code ...
}
```

**Step 5: Test complete game**

```bash
npm run dev
```

Expected: Complete full game, see stats in console with accuracy, times, etc.

**Step 6: Commit stats calculation**

```bash
git add src/lua/game-state.lua src/lua/init.lua src/App.jsx
git commit -m "feat: add statistics calculation with timing"
```

---

## Task 11: Stats Screen UI

**Files:**
- Create: `src/components/StatsScreen.jsx`
- Modify: `src/App.jsx`

**Step 1: Create StatsScreen component**

Create: `src/components/StatsScreen.jsx`

```jsx
import React, { useEffect, useState } from 'react'
import { callLuaFunction } from '../lib/lua-bridge.js'

export default function StatsScreen({ onNewGame }) {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    const gameStats = callLuaFunction('getStats')
    setStats(gameStats)
  }, [])

  if (!stats) {
    return <div style={styles.loading}>Calculating stats...</div>
  }

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Game Complete!</h1>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalMoves}</div>
          <div style={styles.statLabel}>Total Moves</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.correctFirstTry}</div>
          <div style={styles.statLabel}>Correct First Try</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.wrongAttempts}</div>
          <div style={styles.statLabel}>Wrong Attempts</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.accuracy}%</div>
          <div style={styles.statLabel}>Accuracy</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.totalTimeFormatted}</div>
          <div style={styles.statLabel}>Total Time</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statValue}>{stats.avgTimePerMove.toFixed(1)}s</div>
          <div style={styles.statLabel}>Avg Time per Move</div>
        </div>
      </div>

      <div style={styles.summary}>
        <h3>Summary</h3>
        <p>
          You completed {stats.totalMoves} moves in {stats.totalTimeFormatted}.
        </p>
        <p>
          You got {stats.correctFirstTry} moves right on the first try ({stats.accuracy}% accuracy)
          and made {stats.wrongAttempts} mistakes.
        </p>
      </div>

      <button style={styles.button} onClick={onNewGame}>
        Play Another Game
      </button>
    </div>
  )
}

const styles = {
  container: {
    maxWidth: '900px',
    margin: '40px auto',
    padding: '40px',
    fontFamily: 'sans-serif',
    textAlign: 'center'
  },
  loading: {
    textAlign: 'center',
    padding: '40px',
    fontSize: '18px'
  },
  title: {
    fontSize: '36px',
    color: '#4CAF50',
    marginBottom: '40px'
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '40px'
  },
  statCard: {
    padding: '30px',
    backgroundColor: '#f5f5f5',
    borderRadius: '10px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  statValue: {
    fontSize: '48px',
    fontWeight: 'bold',
    color: '#2196F3',
    marginBottom: '10px'
  },
  statLabel: {
    fontSize: '14px',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: '1px'
  },
  summary: {
    backgroundColor: '#e3f2fd',
    padding: '30px',
    borderRadius: '10px',
    marginBottom: '30px',
    lineHeight: '1.8'
  },
  button: {
    padding: '15px 40px',
    fontSize: '18px',
    fontWeight: 'bold',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  }
}
```

**Step 2: Integrate StatsScreen in App.jsx**

Modify: `src/App.jsx`:

```jsx
import StatsScreen from './components/StatsScreen.jsx'

// Add reset function:
const handleNewGame = () => {
  setGameState(null)
  setError(null)
  // Re-initialize Lua
  window.location.reload()
}

// In phase routing:
if (gameState.phase === 'complete') {
  return <StatsScreen onNewGame={handleNewGame} />
}
```

**Step 3: Test stats screen**

```bash
npm run dev
```

Expected: Complete a game → see stats screen with all metrics, click "Play Another Game" → return to upload

**Step 4: Commit stats screen**

```bash
git add src/components/StatsScreen.jsx src/App.jsx
git commit -m "feat: add stats screen with detailed metrics"
```

---

## Task 12: Polish and Styling

**Files:**
- Create: `src/styles.css`
- Modify: `index.html`
- Modify: Various components

**Step 1: Create global styles**

Create: `src/styles.css`

```css
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  padding: 20px;
}

#root {
  max-width: 1200px;
  margin: 0 auto;
}

/* Goban container styling */
.shudan-goban {
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
}

/* Button hover effects */
button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
}

button:active:not(:disabled) {
  transform: translateY(0);
}

button:disabled {
  opacity: 0.5;
}

/* Animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.fade-in {
  animation: fadeIn 0.3s ease-out;
}
```

**Step 2: Import styles**

Modify: `index.html`:

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Go Memory Replay Game</title>
  <link rel="stylesheet" href="/node_modules/@sabaki/shudan/css/goban.css" />
  <link rel="stylesheet" href="/src/styles.css" />
</head>
```

**Step 3: Add fade-in animations**

Modify each component to add `className="fade-in"` to top-level div:

```jsx
// UploadPhase.jsx
<div style={styles.container} className="fade-in">

// StudyPhase.jsx
<div style={styles.container} className="fade-in">

// ReplayPhase.jsx
<div style={styles.container} className="fade-in">

// StatsScreen.jsx
<div style={styles.container} className="fade-in">
```

**Step 4: Test styling**

```bash
npm run dev
```

Expected: Nice background gradient, smooth animations between phases

**Step 5: Commit styling**

```bash
git add src/styles.css index.html src/components/
git commit -m "style: add global styles and animations"
```

---

## Task 13: README and Documentation

**Files:**
- Create: `README.md`
- Create: `docs/ARCHITECTURE.md`

**Step 1: Create README**

Create: `README.md`

```markdown
# Go Memory Replay Game

A web-based training tool for Go players to improve their game memory and pattern recognition.

## Features

- **Study Phase**: Review games move-by-move using SGF files
- **Replay Challenge**: Replay moves from memory
- **Progressive Hints**: Get multiple-choice hints when stuck
- **Statistics**: Track accuracy, timing, and performance

## Tech Stack

- **React** - UI framework
- **Vite** - Build tool
- **Lua (via Fengari)** - Game logic engine
- **Shudan** - Goban rendering
- **@sabaki/sgf** - SGF parser

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm run preview
```

## Usage

1. Upload an SGF file (19×19 games only)
2. Study the game using ← → buttons
3. Click "Start Replay Challenge"
4. Click on intersections to place stones from memory
5. Wrong moves trigger 4-option hints with move numbers
6. Complete the game to see your statistics

## Game Logic Architecture

All game logic runs in Lua via Fengari (Lua VM in JavaScript):

- `src/lua/game-state.lua` - Core game state and validation
- `src/lua/init.lua` - Lua initialization and exports
- `src/lib/lua-bridge.js` - JavaScript ↔ Lua interface

React components are thin rendering layers that call Lua functions.

## License

MIT
```

**Step 2: Create architecture doc**

Create: `docs/ARCHITECTURE.md`

```markdown
# Architecture Documentation

## Overview

The Go Memory Replay Game separates concerns between rendering (React) and game logic (Lua).

## Component Hierarchy

```
App
├── UploadPhase (phase: upload)
├── StudyPhase (phase: study)
├── ReplayPhase (phase: replay)
│   └── HintOverlay
└── StatsScreen (phase: complete)
```

## Data Flow

```
User Action (React)
    ↓
callLuaFunction() (lua-bridge.js)
    ↓
Fengari Lua VM
    ↓
game-state.lua logic
    ↓
Return JavaScript object
    ↓
React setState → Re-render
```

## Lua API

### Initialization

- `initGame(moves)` - Load game from parsed SGF moves

### Study Phase

- `studyNext()` - Advance one move
- `studyPrev()` - Go back one move
- `beginReplay()` - Start replay phase

### Replay Phase

- `replayMove(x, y)` - Validate player move
- `selectHint(x, y)` - Validate hint selection
- `getStats()` - Get final statistics

### State

- `getGameState()` - Get current state for rendering

## Board Representation

Lua uses 0-indexed 2D array:

```lua
boardState[y][x] = sign
```

Where:
- `sign = 0` → empty
- `sign = 1` → black stone
- `sign = -1` → white stone

React/Shudan uses same format.

## Hint System

1. Wrong move triggers `validateMove(x, y)`
2. Lua generates 4 positions:
   - 1 correct position
   - 3 random nearby empty positions
3. Returns `hintOptions` array
4. React converts to `ghostStoneMap` and `markerMap`
5. User clicks ghost stone
6. Calls `selectHint(x, y)`

## Statistics

Tracked in Lua:
- `correctFirstTry` - Moves correct without hints
- `wrongMoveCount` - Total mistakes
- `moveTimes` - Array of seconds per move
- `startTime` - Game start timestamp

Calculated on complete:
- Accuracy percentage
- Average time per move
- Total time formatted
```

**Step 3: Test everything**

```bash
npm run dev
```

Run through complete workflow: upload → study → replay → stats

**Step 4: Final commit**

```bash
git add README.md docs/ARCHITECTURE.md
git commit -m "docs: add README and architecture documentation"
```

**Step 5: Create release tag**

```bash
git tag -a v1.0.0 -m "Release v1.0.0: Go Memory Replay Game"
```

---

## Summary

**Implementation complete!** The game includes:

✅ SGF upload and parsing
✅ Study phase with move navigation
✅ Replay phase with move validation
✅ Progressive hint system (4 ghost stones)
✅ Move numbers on hints
✅ Statistics tracking
✅ Polished UI with animations
✅ Complete documentation

**Total Tasks:** 13
**Estimated Time:** 4-6 hours for experienced developer
**Commits:** 13+ meaningful commits

**To Run:**
```bash
cd /home/csessh/Documents/covay/go-memory-game
npm install
npm run dev
```
