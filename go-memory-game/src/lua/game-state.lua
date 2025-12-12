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
