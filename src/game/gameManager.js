import Board from '@sabaki/go-board'
import { DEFAULT_BOARD_SIZE, PHASES, HINT_TYPES, colorToSign } from './constants'
import { getQuadrantBounds, getSubQuadrant, isRegionSmallEnough } from './boardUtils'

export default class GameManager {
  constructor(moves, boardSize = DEFAULT_BOARD_SIZE) {
    if (!Array.isArray(moves)) {
      throw new Error('moves must be an array')
    }
    this.moves = [...moves]
    this.boardSize = boardSize
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0
    this.boardHistory = [Board.fromDimensions(boardSize, boardSize)]
    this.wrongAttemptsCurrentMove = 0
    this.currentHintRegion = null
    this.replayStartMove = 0
    this.replayEndMove = this.moves.length - 1
    this.replaySide = null
    this.wrongAttemptsByMove = []

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      subdivisionHintsUsed: 0,
      exactHintsUsed: 0,
      startTime: null,
      moveTimes: []
    }
  }

  getCurrentBoard() {
    return this.boardHistory[this.studyPosition]
  }

  getLastMove() {
    return this.studyPosition > 0 ? this.moves[this.studyPosition - 1] : null
  }

  getCurrentTurn() {
    const position = this.phase === PHASES.REPLAY ? this.replayPosition : this.studyPosition
    return this.moves[position]?.color || null
  }

  getState() {
    return {
      phase: this.phase,
      studyPosition: this.studyPosition,
      replayPosition: this.replayPosition,
      totalMoves: this.moves.length,
      boardSize: this.boardSize,
      boardState: this.getCurrentBoard().signMap,
      stats: { ...this.stats }
    }
  }

  getCompletionStats() {
    const totalTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
    const replayedMoves = this.replayEndMove - this.replayStartMove + 1
    const avgTime = replayedMoves > 0 ? totalTime / replayedMoves : 0

    return {
      totalMoves: replayedMoves,
      totalTimeMs: totalTime,
      totalTimeFormatted: (totalTime / 1000).toFixed(1),
      avgTimeMs: avgTime,
      avgTimeFormatted: (avgTime / 1000).toFixed(2),
      wrongMoveCount: this.stats.wrongMoveCount,
      correctFirstTry: this.stats.correctFirstTry,
      accuracy:
        replayedMoves > 0 ? Math.round((this.stats.correctFirstTry / replayedMoves) * 100) : 0
    }
  }

  studyNext() {
    if (this.studyPosition >= this.moves.length) {
      return { atEnd: true, position: this.studyPosition }
    }

    if (this.studyPosition === this.boardHistory.length - 1) {
      const move = this.moves[this.studyPosition]
      const sign = colorToSign(move.color)
      const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])
      this.boardHistory.push(newBoard)
    }

    this.studyPosition++

    return {
      success: true,
      position: this.studyPosition,
      move: this.moves[this.studyPosition - 1]
    }
  }

  studyPrev() {
    if (this.studyPosition === 0) {
      return { atStart: true, position: 0 }
    }

    this.studyPosition--

    return {
      success: true,
      position: this.studyPosition
    }
  }

  startReplay(startMove = 0, endMove = this.moves.length - 1, side = null) {
    this.phase = PHASES.REPLAY
    this.replayStartMove = startMove
    this.replayEndMove = endMove
    this.replaySide = side
    this.replayPosition = startMove
    this.studyPosition = startMove
    this.wrongAttemptsCurrentMove = 0
    this.wrongAttemptsByMove = []
    this.stats.startTime = Date.now()
    this.stats.wrongMoveCount = 0
    this.stats.correctFirstTry = 0
    this.stats.moveTimes = []

    return {
      success: true,
      phase: this.phase
    }
  }

  resetGame() {
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0
    this.wrongAttemptsCurrentMove = 0
    this.currentHintRegion = null
    this.replayStartMove = 0
    this.replayEndMove = this.moves.length - 1
    this.wrongAttemptsByMove = []

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      subdivisionHintsUsed: 0,
      exactHintsUsed: 0,
      startTime: null,
      moveTimes: []
    }

    return {
      success: true,
      phase: this.phase
    }
  }

  isUserMove(position) {
    if (this.replaySide === null) return true
    const move = this.moves[position]
    if (!move) return false
    return move.color === this.replaySide
  }

  playOpponentMove() {
    if (this.phase !== PHASES.REPLAY) {
      return { error: 'Not in replay phase' }
    }

    if (this.replayPosition > this.replayEndMove) {
      return { error: 'All moves completed' }
    }

    if (this.isUserMove(this.replayPosition)) {
      return { error: 'Current move is not opponent move' }
    }

    const move = this.moves[this.replayPosition]
    const sign = colorToSign(move.color)
    const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])
    this.boardHistory.push(newBoard)
    this.studyPosition++
    this.replayPosition++

    if (this.replayPosition > this.replayEndMove) {
      this.phase = PHASES.COMPLETE
      return { success: true, move, gameComplete: true }
    }

    return { success: true, move }
  }

  validateMove(x, y) {
    if (this.phase !== PHASES.REPLAY) {
      return { error: 'Not in replay phase' }
    }

    if (this.replayPosition >= this.moves.length) {
      return { error: 'All moves completed' }
    }

    const correctMove = this.moves[this.replayPosition]
    const isCorrect = correctMove.x === x && correctMove.y === y

    if (isCorrect) {
      const sign = colorToSign(correctMove.color)
      const newBoard = this.getCurrentBoard().makeMove(sign, [x, y])
      this.boardHistory.push(newBoard)
      this.studyPosition++

      if (this.wrongAttemptsCurrentMove === 0) {
        this.stats.correctFirstTry++
      }

      const moveTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
      this.stats.moveTimes.push(moveTime)

      this.replayPosition++
      this.wrongAttemptsCurrentMove = 0
      this.currentHintRegion = null

      if (this.replayPosition > this.replayEndMove) {
        this.phase = PHASES.COMPLETE
        return {
          correct: true,
          gameComplete: true
        }
      }

      return {
        correct: true,
        needHint: false,
        currentMove: this.replayPosition
      }
    }

    this.wrongAttemptsCurrentMove++
    this.stats.wrongMoveCount++

    if (!this.wrongAttemptsByMove[this.replayPosition]) {
      this.wrongAttemptsByMove[this.replayPosition] = {
        moveIndex: this.replayPosition,
        wrongAttempts: [],
        correctPosition: { x: correctMove.x, y: correctMove.y }
      }
    }
    this.wrongAttemptsByMove[this.replayPosition].wrongAttempts.push({ x, y })

    if (this.wrongAttemptsCurrentMove === 1) {
      this.stats.quadrantHintsUsed++
      this.currentHintRegion = getQuadrantBounds(correctMove, this.boardSize)
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.QUADRANT,
        region: this.currentHintRegion
      }
    }

    if (isRegionSmallEnough(this.currentHintRegion)) {
      this.stats.exactHintsUsed++
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.EXACT,
        position: { x: correctMove.x, y: correctMove.y }
      }
    }

    this.stats.subdivisionHintsUsed++
    this.currentHintRegion = getSubQuadrant(this.currentHintRegion, correctMove)
    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.QUADRANT,
      region: this.currentHintRegion
    }
  }

  getWrongAttempts(moveIndex) {
    const record = this.wrongAttemptsByMove[moveIndex]
    return record ? record.wrongAttempts : []
  }

  getDifficultMoves(limit = 5) {
    return this.wrongAttemptsByMove
      .filter((record) => record && record.wrongAttempts.length > 0)
      .map((record) => ({
        moveIndex: record.moveIndex,
        wrongAttempts: record.wrongAttempts,
        correctPosition: record.correctPosition,
        attemptCount: record.wrongAttempts.length
      }))
      .sort((a, b) => b.attemptCount - a.attemptCount)
      .slice(0, limit)
  }

  getBoardAtPosition(position) {
    if (position < 0 || position >= this.boardHistory.length) {
      return null
    }
    return this.boardHistory[position]
  }

  isValidPosition(x, y) {
    if (this.phase !== PHASES.REPLAY) return false
    const board = this.getCurrentBoard()
    if (!board) return false
    if (x < 0 || x >= this.boardSize || y < 0 || y >= this.boardSize) return false
    if (board.signMap[y][x] !== 0) return false
    return true
  }
}
