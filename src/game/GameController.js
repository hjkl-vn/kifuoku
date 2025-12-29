import { useState, useMemo, useReducer } from 'react'
import GameManager from './GameManager'

export default function GameController(sgfMoves, boardSize, { onStonePlace } = {}) {
  const [manager] = useState(() => new GameManager(sgfMoves, boardSize))
  const [, forceUpdate] = useReducer((x) => x + 1, 0)

  const wrappedManager = useMemo(
    () => ({
      get phase() {
        return manager.phase
      },
      get moves() {
        return manager.moves
      },
      get boardSize() {
        return manager.boardSize
      },
      get studyPosition() {
        return manager.studyPosition
      },
      get replayPosition() {
        return manager.replayPosition
      },
      get stats() {
        return manager.stats
      },
      get currentHintRegion() {
        return manager.currentHintRegion
      },
      get wrongAttemptsCurrentMove() {
        return manager.wrongAttemptsCurrentMove
      },

      studyNext() {
        const result = manager.studyNext()
        forceUpdate()
        if (result.success) onStonePlace?.()
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

      resetGame() {
        const result = manager.resetGame()
        forceUpdate()
        return result
      },

      validateMove(x, y) {
        const result = manager.validateMove(x, y)
        forceUpdate()
        if (result.correct) onStonePlace?.()
        return result
      },

      getCurrentBoard() {
        return manager.getCurrentBoard()
      },

      getLastMove() {
        return manager.getLastMove()
      },

      getCurrentTurn() {
        return manager.getCurrentTurn()
      },

      getState() {
        return manager.getState()
      },

      getCompletionStats() {
        return manager.getCompletionStats()
      },

      getBoardAtPosition(position) {
        return manager.getBoardAtPosition(position)
      },

      getDifficultMoves(limit = 5) {
        return manager.getDifficultMoves(limit)
      },

      getWrongAttempts(moveIndex) {
        return manager.getWrongAttempts(moveIndex)
      }
    }),
    [manager, onStonePlace]
  )

  return wrappedManager
}
