local game = GameState.new()

function initGame(movesJSON)
	-- movesJSON is a JSON string from JavaScript
	-- Fengari will convert it to Lua table
	print("DEBUG: In initGame, about to call game:loadGame")
	print("DEBUG: game type:", type(game))
	print("DEBUG: movesJSON type:", type(movesJSON))
	local result = game:loadGame(movesJSON)
	print("DEBUG: result type:", type(result))
	print("DEBUG: result.phase:", result.phase)
	return result
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

function selectHint(x, y)
	return game:selectHint(x, y)
end

print("Lua game engine initialized")
