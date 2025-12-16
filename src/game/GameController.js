import { useState, useMemo, useReducer } from 'react'
import GameManager from './GameManager'

export default function GameController(sgfMoves, boardSize) {
  const [manager] = useState(() => new GameManager(sgfMoves, boardSize))
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  const wrappedManager = useMemo(() => ({
    get phase() { return manager.phase },
    get moves() { return manager.moves },
    get boardSize() { return manager.boardSize },
    get studyPosition() { return manager.studyPosition },
    get replayPosition() { return manager.replayPosition },
    get stats() { return manager.stats },
    get currentGhostStones() { return manager.currentGhostStones },
    get wrongAttemptsCurrentMove() { return manager.wrongAttemptsCurrentMove },

    studyNext() {
      const result = manager.studyNext()
      forceUpdate()
      return result
    },

    studyPrev() {
      const result = manager.studyPrev()
      forceUpdate()
      return result
    },

    startReplay(startMove, endMove) {
      const result = manager.startReplay(startMove, endMove)
      forceUpdate()
      return result
    },

    validateMove(x, y) {
      const result = manager.validateMove(x, y)
      forceUpdate()
      return result
    },

    handleGhostClick(x, y) {
      const result = manager.handleGhostClick(x, y)
      forceUpdate()
      return result
    },

    getCurrentBoard() {
      return manager.getCurrentBoard()
    },

    getLastMove() {
      return manager.getLastMove()
    },

    getState() {
      return manager.getState()
    },

    getCompletionStats() {
      return manager.getCompletionStats()
    }
  }), [manager])

  return wrappedManager
}
