-- Create global game instance
-- Note: GameState module should be loaded before this file
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

function studyNext()
  return game:nextMove()
end

function studyPrev()
  return game:prevMove()
end

function beginReplay()
  return game:startReplay()
end

function replayMove(x, y)
  return game:validateMove(x, y)
end

print("Lua game engine initialized")
