import { describe, it, expect } from 'vitest'
import GameManager from '../GameManager'
import { getQuadrant } from '../constants'

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

    it('throws error if moves is not an array', () => {
      expect(() => new GameManager(null)).toThrow('moves must be an array')
      expect(() => new GameManager(undefined)).toThrow('moves must be an array')
      expect(() => new GameManager({ moves: [] })).toThrow('moves must be an array')
      expect(() => new GameManager('moves')).toThrow('moves must be an array')
    })

    it('creates a defensive copy of the moves array', () => {
      const originalMoves = [
        { x: 3, y: 3, color: 'B' },
        { x: 15, y: 15, color: 'W' }
      ]
      const manager = new GameManager(originalMoves)

      originalMoves.push({ x: 5, y: 5, color: 'B' })

      expect(manager.moves).toHaveLength(2)
      expect(manager.moves).not.toBe(originalMoves)
    })
  })

  describe('Study Phase', () => {
    it('studyNext advances position and updates board', () => {
      const manager = new GameManager(mockMoves)

      const result = manager.studyNext()

      expect(result.success).toBe(true)
      expect(manager.studyPosition).toBe(1)
      expect(manager.boardHistory).toHaveLength(2)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
    })

    it('studyNext returns atEnd when at last move', () => {
      const manager = new GameManager(mockMoves)
      manager.studyNext()
      manager.studyNext()
      manager.studyNext()

      const result = manager.studyNext()

      expect(result.atEnd).toBe(true)
      expect(manager.studyPosition).toBe(3)
    })

    it('studyPrev decrements position', () => {
      const manager = new GameManager(mockMoves)
      manager.studyNext()
      manager.studyNext()

      const result = manager.studyPrev()

      expect(result.success).toBe(true)
      expect(manager.studyPosition).toBe(1)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
      expect(manager.getCurrentBoard().get([15, 15])).toBe(0)
    })

    it('studyPrev returns atStart when at beginning', () => {
      const manager = new GameManager(mockMoves)

      const result = manager.studyPrev()

      expect(result.atStart).toBe(true)
      expect(manager.studyPosition).toBe(0)
    })
  })

  describe('Phase Transitions', () => {
    it('startReplay transitions to replay phase and resets board', () => {
      const manager = new GameManager(mockMoves)
      manager.studyNext()
      manager.studyNext()

      const result = manager.startReplay()

      expect(result.success).toBe(true)
      expect(manager.phase).toBe('replay')
      expect(manager.replayPosition).toBe(0)
      expect(manager.getCurrentBoard().isEmpty()).toBe(true)
      expect(manager.stats.startTime).not.toBeNull()
    })
  })

  describe('Hint Generation', () => {
    it('generateGhostStones returns 4 positions with 1 correct', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      const ghosts = manager.generateGhostStones()

      expect(ghosts).toHaveLength(4)
      expect(ghosts.filter(g => g.isCorrect)).toHaveLength(1)

      const correctGhost = ghosts.find(g => g.isCorrect)
      expect(correctGhost.x).toBe(mockMoves[0].x)
      expect(correctGhost.y).toBe(mockMoves[0].y)
    })

    it('ghost positions are valid and unique', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      const ghosts = manager.generateGhostStones()

      ghosts.forEach(ghost => {
        expect(ghost.x).toBeGreaterThanOrEqual(0)
        expect(ghost.x).toBeLessThan(19)
        expect(ghost.y).toBeGreaterThanOrEqual(0)
        expect(ghost.y).toBeLessThan(19)
      })

      const positions = ghosts.map(g => `${g.x},${g.y}`)
      const uniquePositions = new Set(positions)
      expect(uniquePositions.size).toBe(4)
    })

    it('getQuadrantHint returns correct quadrant', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      const hint = manager.getQuadrantHint()

      expect(hint.quadrant).toBe(getQuadrant(mockMoves[0].x, mockMoves[0].y))
      expect(hint.vertices).toBeDefined()
    })
  })

  describe('Move Validation', () => {
    it('validates correct move on first try', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      const result = manager.validateMove(3, 3)

      expect(result.correct).toBe(true)
      expect(result.needHint).toBe(false)
      expect(manager.replayPosition).toBe(1)
      expect(manager.stats.correctFirstTry).toBe(1)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
    })

    it('returns quadrant hint on first wrong attempt', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      const result = manager.validateMove(10, 10)

      expect(result.correct).toBe(false)
      expect(result.needHint).toBe(true)
      expect(result.hintType).toBe('quadrant')
      expect(result.quadrant).toBeDefined()
      expect(manager.stats.quadrantHintsUsed).toBe(1)
      expect(manager.wrongAttemptsCurrentMove).toBe(1)
    })

    it('returns ghost stones on second wrong attempt', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      manager.validateMove(10, 10)
      const result = manager.validateMove(10, 11)

      expect(result.correct).toBe(false)
      expect(result.hintType).toBe('ghost')
      expect(result.ghostStones).toHaveLength(4)
      expect(manager.stats.ghostHintsUsed).toBe(1)
    })

    it('returns triangle hint on third wrong attempt', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      manager.validateMove(10, 10)
      manager.validateMove(10, 11)
      const result = manager.validateMove(10, 12)

      expect(result.correct).toBe(false)
      expect(result.hintType).toBe('triangle')
      expect(result.correctPosition).toEqual({ x: 3, y: 3 })
      expect(manager.stats.triangleHintsUsed).toBe(1)
    })

    it('transitions to complete when all moves done', () => {
      const manager = new GameManager([{ x: 3, y: 3, color: 'B' }])
      manager.startReplay()

      const result = manager.validateMove(3, 3)

      expect(result.correct).toBe(true)
      expect(result.gameComplete).toBe(true)
      expect(manager.phase).toBe('complete')
    })
  })

  describe('Ghost Stone Interaction', () => {
    it('eliminates wrong ghost and returns remaining', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      manager.validateMove(10, 10)
      const ghostResult = manager.validateMove(10, 11)
      const ghosts = ghostResult.ghostStones
      const wrongGhost = ghosts.find(g => !g.isCorrect)

      const result = manager.handleGhostClick(wrongGhost.x, wrongGhost.y)

      expect(result.correct).toBe(false)
      expect(result.eliminated).toBe(true)
      expect(result.remainingGhosts).toHaveLength(3)
    })

    it('places stone when correct ghost clicked', () => {
      const manager = new GameManager(mockMoves)
      manager.startReplay()

      manager.validateMove(10, 10)
      const ghostResult = manager.validateMove(10, 11)
      const correctGhost = ghostResult.ghostStones.find(g => g.isCorrect)

      const result = manager.handleGhostClick(correctGhost.x, correctGhost.y)

      expect(result.correct).toBe(true)
      expect(manager.replayPosition).toBe(1)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
    })
  })
})
