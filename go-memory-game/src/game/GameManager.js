import Board from '@sabaki/go-board'
import { PHASES, HINT_TYPES, colorToSign, getQuadrant, getQuadrantVertices, randomInt } from './constants'

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
    this.currentGhostStones = []

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

  getLastMove() {
    return this.studyPosition > 0 ? this.moves[this.studyPosition - 1] : null
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

  getCompletionStats() {
    const totalTime = this.stats.startTime ? Date.now() - this.stats.startTime : 0
    const totalMoves = this.moves.length
    const avgTime = totalMoves > 0 ? totalTime / totalMoves : 0

    return {
      totalMoves,
      totalTimeMs: totalTime,
      totalTimeFormatted: (totalTime / 1000).toFixed(1),
      avgTimeMs: avgTime,
      avgTimeFormatted: (avgTime / 1000).toFixed(2),
      wrongMoveCount: this.stats.wrongMoveCount,
      correctFirstTry: this.stats.correctFirstTry,
      accuracy: totalMoves > 0 ? Math.round((this.stats.correctFirstTry / totalMoves) * 100) : 0
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

      if (this.replayPosition >= this.moves.length) {
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

    if (this.wrongAttemptsCurrentMove === 1) {
      this.stats.quadrantHintsUsed++
      const hint = this.getQuadrantHint()
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.QUADRANT,
        quadrant: hint.quadrant,
        vertices: hint.vertices
      }
    }

    if (this.wrongAttemptsCurrentMove === 2) {
      this.stats.ghostHintsUsed++
      this.currentGhostStones = this.generateGhostStones()
      return {
        correct: false,
        needHint: true,
        hintType: HINT_TYPES.GHOST,
        ghostStones: this.currentGhostStones,
        nextColor: correctMove.color
      }
    }

    this.stats.triangleHintsUsed++
    return {
      correct: false,
      needHint: true,
      hintType: HINT_TYPES.TRIANGLE,
      correctPosition: { x: correctMove.x, y: correctMove.y },
      nextColor: correctMove.color
    }
  }

  handleGhostClick(x, y) {
    const clickedGhost = this.currentGhostStones.find(g => g.x === x && g.y === y)

    if (!clickedGhost) {
      return { error: 'Invalid ghost position' }
    }

    if (clickedGhost.isCorrect) {
      const correctMove = this.moves[this.replayPosition]
      const sign = colorToSign(correctMove.color)
      const newBoard = this.getCurrentBoard().makeMove(sign, [x, y])
      this.boardHistory.push(newBoard)
      this.studyPosition++

      this.replayPosition++
      this.wrongAttemptsCurrentMove = 0
      this.currentGhostStones = []

      return {
        correct: true,
        currentMove: this.replayPosition
      }
    }

    this.currentGhostStones = this.currentGhostStones.filter(g => g.x !== x || g.y !== y)

    return {
      correct: false,
      eliminated: true,
      remainingGhosts: this.currentGhostStones
    }
  }
}
