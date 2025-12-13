import { describe, it, expect } from 'vitest'
import GameManager from '../GameManager'

describe('GameManager', () => {
  const mockMoves = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 15, color: 'W' },
    { x: 3, y: 15, color: 'B' }
  ]

  describe('constructor', () => {
    it('initializes with correct default state', () => {
      const manager = new GameManager(mockMoves)

      expect(manager.phase).toBe('study')
      expect(manager.moves).toEqual(mockMoves)
      expect(manager.studyPosition).toBe(0)
      expect(manager.replayPosition).toBe(0)
      expect(manager.boardHistory).toHaveLength(1)
      expect(manager.stats.wrongMoveCount).toBe(0)
      expect(manager.stats.correctFirstTry).toBe(0)
    })

    it('creates empty 19x19 board as initial state', () => {
      const manager = new GameManager(mockMoves)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.width).toBe(19)
      expect(initialBoard.height).toBe(19)
      expect(initialBoard.isEmpty()).toBe(true)
    })
  })
})
