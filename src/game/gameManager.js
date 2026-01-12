import Board from '@sabaki/go-board'
import { DEFAULT_BOARD_SIZE, PHASES, HINT_TYPES } from './constants'
import { getQuadrantBounds, getSubQuadrant, isRegionSmallEnough, colorToSign } from './boardUtils'
import { createLogger } from '../lib/logger'

const log = createLogger('GameManager')

function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)

  if (totalSeconds < 60) {
    const decimal = (ms / 1000).toFixed(1)
    return `${decimal} second${decimal === '1.0' ? '' : 's'}`
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  }

  return parts.join(', ')
}

export default class GameManager {
  constructor(moves, boardSize = DEFAULT_BOARD_SIZE, setupStones = []) {
    if (!Array.isArray(moves)) {
      throw new Error('moves must be an array')
    }
    this.moves = [...moves]
    this.boardSize = boardSize
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0

    let board = Board.fromDimensions(boardSize, boardSize)
    for (const stone of setupStones) {
      const sign = colorToSign(stone.color)
      board = board.set([stone.x, stone.y], sign)
    }
    this.boardHistory = [board]

    for (const move of this.moves) {
      if (move.isPass) {
        this.boardHistory.push(board)
      } else {
        const sign = colorToSign(move.color)
        board = board.makeMove(sign, [move.x, move.y])
        this.boardHistory.push(board)
      }
    }

    this.wrongAttemptsCurrentMove = 0
    this.currentHintRegion = null
    this.replayStartMove = 0
    this.replayEndMove = this.moves.length - 1
    this.replaySide = null
    this.wrongAttemptsByMove = []
    this.oneColorMode = false

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      subdivisionHintsUsed: 0,
      exactHintsUsed: 0,
      startTime: null,
      endTime: null,
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
      stats: { ...this.stats },
      oneColorMode: this.oneColorMode
    }
  }

  getReplaySide() {
    return this.replaySide
  }

  getCompletionStats() {
    const endTime = this.stats.endTime || Date.now()
    const totalTime = this.stats.startTime ? endTime - this.stats.startTime : 0

    let userMoveCount
    if (this.replaySide === null) {
      userMoveCount = this.replayEndMove - this.replayStartMove + 1
    } else {
      userMoveCount = this.moves
        .slice(this.replayStartMove, this.replayEndMove + 1)
        .filter((m) => m.color === this.replaySide).length
    }

    const avgTime = userMoveCount > 0 ? totalTime / userMoveCount : 0

    return {
      totalMoves: userMoveCount,
      totalTimeMs: totalTime,
      totalTimeFormatted: formatDuration(totalTime),
      avgTimeMs: avgTime,
      avgTimeFormatted: formatDuration(avgTime),
      wrongMoveCount: this.stats.wrongMoveCount,
      correctFirstTry: this.stats.correctFirstTry,
      accuracy:
        userMoveCount > 0 ? Math.round((this.stats.correctFirstTry / userMoveCount) * 100) : 0
    }
  }

  studyNext() {
    if (this.studyPosition >= this.moves.length) {
      return { atEnd: true, position: this.studyPosition }
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

  startReplay(startMove = 0, endMove = this.moves.length - 1, side = null, oneColorMode = false) {
    this.phase = PHASES.REPLAY
    this.replayStartMove = startMove
    this.replayEndMove = endMove
    this.replaySide = side
    this.oneColorMode = oneColorMode
    this.replayPosition = startMove
    this.studyPosition = startMove
    this.wrongAttemptsCurrentMove = 0
    this.wrongAttemptsByMove = []
    this.stats.startTime = Date.now()
    this.stats.wrongMoveCount = 0
    this.stats.correctFirstTry = 0
    this.stats.moveTimes = []

    log.info('Replay started', { startMove, endMove, side, totalMoves: this.moves.length })

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
    this.oneColorMode = false

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      subdivisionHintsUsed: 0,
      exactHintsUsed: 0,
      startTime: null,
      endTime: null,
      moveTimes: []
    }

    log.info('Game reset')

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
      log.warn('Action rejected', { action: 'playOpponentMove', currentPhase: this.phase })
      return { error: 'Not in replay phase' }
    }

    if (this.replayPosition > this.replayEndMove) {
      return { error: 'All moves completed' }
    }

    if (this.isUserMove(this.replayPosition)) {
      return { error: 'Current move is not opponent move' }
    }

    const move = this.moves[this.replayPosition]

    if (!move.isPass) {
      const sign = colorToSign(move.color)
      const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])
      this.boardHistory.push(newBoard)
      this.studyPosition++
    }

    this.replayPosition++
    log.info('Opponent move played', {
      moveNumber: this.replayPosition,
      color: move.color,
      position: move.isPass ? 'pass' : [move.x, move.y]
    })

    if (this.replayPosition > this.replayEndMove) {
      this.phase = PHASES.COMPLETE
      this.stats.endTime = Date.now()
      log.info('Game completed', { stats: this.getCompletionStats() })
      return { success: true, move, gameComplete: true }
    }

    return { success: true, move }
  }

  validateMove(x, y) {
    if (this.phase !== PHASES.REPLAY) {
      log.warn('Action rejected', { action: 'validateMove', currentPhase: this.phase })
      return { error: 'Not in replay phase' }
    }

    if (this.replayPosition >= this.moves.length) {
      return { error: 'All moves completed' }
    }

    const correctMove = this.moves[this.replayPosition]

    if (correctMove.isPass) {
      this.wrongAttemptsCurrentMove++
      this.stats.wrongMoveCount++
      log.warn('Wrong move', { expected: 'pass', got: [x, y] })
      return {
        correct: false,
        expectedPass: true
      }
    }

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

      log.info('Move validated', {
        moveNumber: this.replayPosition,
        color: correctMove.color,
        position: [x, y]
      })

      if (this.replayPosition > this.replayEndMove) {
        this.phase = PHASES.COMPLETE
        this.stats.endTime = Date.now()
        log.info('Game completed', { stats: this.getCompletionStats() })
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
    log.warn('Wrong move', { expected: [correctMove.x, correctMove.y], got: [x, y] })

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
      log.info('Hint triggered', { level: 'quadrant', region: this.currentHintRegion })
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.QUADRANT,
        region: this.currentHintRegion
      }
    }

    if (isRegionSmallEnough(this.currentHintRegion)) {
      this.stats.exactHintsUsed++
      log.info('Showing exact position', { position: [correctMove.x, correctMove.y] })
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.EXACT,
        position: { x: correctMove.x, y: correctMove.y }
      }
    }

    this.stats.subdivisionHintsUsed++
    const previousRegion = this.currentHintRegion
    this.currentHintRegion = getSubQuadrant(this.currentHintRegion, correctMove)
    log.info('Hint region narrowed', { from: previousRegion, to: this.currentHintRegion })
    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.QUADRANT,
      region: this.currentHintRegion
    }
  }

  validatePass() {
    if (this.phase !== PHASES.REPLAY) {
      log.warn('Action rejected', { action: 'validatePass', currentPhase: this.phase })
      return { error: 'Not in replay phase' }
    }

    if (this.replayPosition > this.replayEndMove) {
      return { error: 'All moves completed' }
    }

    const correctMove = this.moves[this.replayPosition]
    const isCorrect = correctMove.isPass === true

    if (isCorrect) {
      if (this.wrongAttemptsCurrentMove === 0) {
        this.stats.correctFirstTry++
      }

      const moveTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
      this.stats.moveTimes.push(moveTime)

      this.replayPosition++
      this.wrongAttemptsCurrentMove = 0
      this.currentHintRegion = null

      log.info('Pass validated', { moveNumber: this.replayPosition })

      if (this.replayPosition > this.replayEndMove) {
        this.phase = PHASES.COMPLETE
        this.stats.endTime = Date.now()
        log.info('Game completed', { stats: this.getCompletionStats() })
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
    this.stats.quadrantHintsUsed++
    this.currentHintRegion = getQuadrantBounds(correctMove, this.boardSize)

    log.warn('Wrong pass', { expectedMove: [correctMove.x, correctMove.y] })
    log.info('Hint triggered', { level: 'quadrant', region: this.currentHintRegion })

    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.QUADRANT,
      region: this.currentHintRegion,
      expectedStone: true
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
