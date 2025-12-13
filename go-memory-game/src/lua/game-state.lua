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
		boardState = {},
	}

	-- Set up metatable for method inheritance
	setmetatable(self, { __index = GameState })

	-- Initialize empty board (1-based indexing: 1-19)
	for y = 1, 19 do
		self.boardState[y] = {}
		for x = 1, 19 do
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
		totalMoves = #moves,
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
		correctFirstTry = self.correctFirstTry,
	}
end

-- Utility: Convert color string to sign
function GameState.colorToSign(color)
	if color == "B" then
		return 1
	elseif color == "W" then
		return -1
	else
		return 0
	end
end

-- Utility: Update board state with move
-- Converts from 0-based JS coordinates (0-18) to 1-based Lua (1-19)
function GameState.applyMove(self, x, y, color)
	local luaX = x + 1
	local luaY = y + 1
	local sign = GameState.colorToSign(color)
	if self.boardState[luaY] then
		self.boardState[luaY][luaX] = sign
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
			boardState = self.boardState,
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
		-- Remove stone from board (convert 0-based JS coords to 1-based Lua)
		local move = self.correctMoves[self.studyPosition]
		self.boardState[move.y + 1][move.x + 1] = 0

		self.studyPosition = self.studyPosition - 1

		return {
			success = true,
			position = self.studyPosition,
			boardState = self.boardState,
		}
	end

	return { atStart = true, position = 0 }
end

-- Study Phase: Start replay
function GameState.startReplay(self)
	if self.phase ~= "study" then
		return { error = "Not in study phase" }
	end

	-- Reset board (1-based indexing: 1-19)
	for y = 1, 19 do
		for x = 1, 19 do
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
		boardState = self.boardState,
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
				boardState = self.boardState,
			}
		end

		return {
			correct = true,
			needHint = false,
			currentMove = self.currentMoveIndex,
			boardState = self.boardState,
		}
	else
		-- Wrong move - generate hints
		self.wrongMoveCount = self.wrongMoveCount + 1

		local hints = self:generateHints()

		return {
			correct = false,
			needHint = true,
			wrongMove = { x = x, y = y },
			hintOptions = hints,
			nextColor = self.correctMoves[self.currentMoveIndex].color
		}
	end
end

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
	-- Must be on board (0-18 for 0-based coordinates from JS)
	if x < 0 or x > 18 or y < 0 or y > 18 then
		return false
	end

	-- Must be empty (convert 0-based JS coords to 1-based Lua)
	local luaX = x + 1
	local luaY = y + 1
	if self.boardState[luaY][luaX] ~= 0 then
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
