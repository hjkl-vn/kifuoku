import Board from '@sabaki/go-board'
import { PHASES, colorToSign } from './constants'

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
}
