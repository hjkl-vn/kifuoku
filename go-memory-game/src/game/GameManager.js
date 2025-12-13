import Board from '@sabaki/go-board'
import { PHASES, colorToSign, getQuadrant, getQuadrantVertices, randomInt } from './constants'

export default class GameManager {
  constructor(moves) {
    if (!Array.isArray(moves)) {
      throw new Error('moves must be an array')
    }
    this.moves = [...moves]
    this.phase = PHASES.STUDY
    this.studyPosition = 0
    this.replayPosition = 0
    this.boardHistory = [Board.fromDimensions(19, 19)]
    this.wrongAttemptsCurrentMove = 0

    this.stats = {
      wrongMoveCount: 0,
      correctFirstTry: 0,
      quadrantHintsUsed: 0,
      ghostHintsUsed: 0,
      triangleHintsUsed: 0,
      startTime: null,
      moveTimes: []
    }
  }

  getCurrentBoard() {
    return this.boardHistory[this.studyPosition]
  }

  getState() {
    return {
      phase: this.phase,
      studyPosition: this.studyPosition,
      replayPosition: this.replayPosition,
      totalMoves: this.moves.length,
      boardState: this.getCurrentBoard().signMap,
      stats: { ...this.stats }
    }
  }

  studyNext() {
    if (this.studyPosition >= this.moves.length) {
      return { atEnd: true, position: this.studyPosition }
    }

    const move = this.moves[this.studyPosition]
    const sign = colorToSign(move.color)
    const newBoard = this.getCurrentBoard().makeMove(sign, [move.x, move.y])

    this.boardHistory.push(newBoard)
    this.studyPosition++

    return {
      success: true,
      position: this.studyPosition,
      move: move
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

  startReplay() {
    this.phase = PHASES.REPLAY
    this.replayPosition = 0
    this.studyPosition = 0
    this.wrongAttemptsCurrentMove = 0
    this.stats.startTime = Date.now()
    this.stats.wrongMoveCount = 0
    this.stats.correctFirstTry = 0
    this.stats.moveTimes = []

    return {
      success: true,
      phase: this.phase
    }
  }

  generateGhostStones() {
    if (this.replayPosition >= this.moves.length) {
      return []
    }

    const correctMove = this.moves[this.replayPosition]
    const options = [{
      x: correctMove.x,
      y: correctMove.y,
      isCorrect: true
    }]

    let attempts = 0
    while (options.length < 4 && attempts < 100) {
      const dx = randomInt(-4, 4)
      const dy = randomInt(-4, 4)

      if (dx === 0 && dy === 0) {
        attempts++
        continue
      }

      const newX = correctMove.x + dx
      const newY = correctMove.y + dy

      if (this.isValidHintPosition(newX, newY, options)) {
        options.push({
          x: newX,
          y: newY,
          isCorrect: false
        })
      }

      attempts++
    }

    return options
  }

  isValidHintPosition(x, y, existingOptions) {
    if (x < 0 || x > 18 || y < 0 || y > 18) {
      return false
    }

    if (this.getCurrentBoard().get([x, y]) !== 0) {
      return false
    }

    if (existingOptions.some(opt => opt.x === x && opt.y === y)) {
      return false
    }

    return true
  }

  getQuadrantHint() {
    const correctMove = this.moves[this.replayPosition]
    const quadrant = getQuadrant(correctMove.x, correctMove.y)
    const vertices = getQuadrantVertices(quadrant)

    return {
      quadrant,
      vertices
    }
  }
}
