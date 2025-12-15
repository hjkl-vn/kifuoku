import { useState, useMemo, useReducer } from 'react'
import GameManager from './GameManager'

export default function useGameManager(sgfMoves) {
  const [manager] = useState(() => new GameManager(sgfMoves))
  const [, forceUpdate] = useReducer(x => x + 1, 0)

  const wrappedManager = useMemo(() => ({
    get phase() { return manager.phase },
    get moves() { return manager.moves },
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

    startReplay() {
      const result = manager.startReplay()
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

    getState() {
      return manager.getState()
    },

    getCompletionStats() {
      return manager.getCompletionStats()
    }
  }), [manager])

  return wrappedManager
}
