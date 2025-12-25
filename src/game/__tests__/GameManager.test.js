import { describe, it, expect } from 'vitest'
import GameManager from '../GameManager'
import { getQuadrantBounds, getSubQuadrant, isRegionSmallEnough } from '../board-utils'

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

    it('navigating back and forward maintains correct board state', () => {
      const manager = new GameManager(mockMoves)

      manager.studyNext()
      manager.studyNext()
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
      expect(manager.getCurrentBoard().get([15, 15])).toBe(-1)

      manager.studyPrev()
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
      expect(manager.getCurrentBoard().get([15, 15])).toBe(0)

      manager.studyNext()
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
      expect(manager.getCurrentBoard().get([15, 15])).toBe(-1)

      expect(manager.boardHistory).toHaveLength(3)
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
      expect(result.region).toBeDefined()
      expect(manager.stats.quadrantHintsUsed).toBe(1)
      expect(manager.wrongAttemptsCurrentMove).toBe(1)
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
})

describe('getQuadrantBounds', () => {
  it('returns upper-left quadrant for move in upper-left', () => {
    const bounds = getQuadrantBounds({ x: 3, y: 3 }, 19)
    expect(bounds).toEqual({ minX: 0, maxX: 8, minY: 0, maxY: 8 })
  })

  it('returns lower-right quadrant for move in lower-right', () => {
    const bounds = getQuadrantBounds({ x: 15, y: 15 }, 19)
    expect(bounds).toEqual({ minX: 9, maxX: 18, minY: 9, maxY: 18 })
  })

  it('returns upper-right quadrant for move in upper-right', () => {
    const bounds = getQuadrantBounds({ x: 12, y: 4 }, 19)
    expect(bounds).toEqual({ minX: 9, maxX: 18, minY: 0, maxY: 8 })
  })

  it('returns lower-left quadrant for move in lower-left', () => {
    const bounds = getQuadrantBounds({ x: 4, y: 12 }, 19)
    expect(bounds).toEqual({ minX: 0, maxX: 8, minY: 9, maxY: 18 })
  })
})

describe('getSubQuadrant', () => {
  it('subdivides region to upper-left sub-quadrant', () => {
    const region = { minX: 0, maxX: 8, minY: 0, maxY: 8 }
    const subRegion = getSubQuadrant(region, { x: 2, y: 2 })
    expect(subRegion).toEqual({ minX: 0, maxX: 4, minY: 0, maxY: 4 })
  })

  it('subdivides region to lower-right sub-quadrant', () => {
    const region = { minX: 0, maxX: 8, minY: 0, maxY: 8 }
    const subRegion = getSubQuadrant(region, { x: 7, y: 7 })
    expect(subRegion).toEqual({ minX: 5, maxX: 8, minY: 5, maxY: 8 })
  })

  it('subdivides small region correctly', () => {
    const region = { minX: 0, maxX: 4, minY: 0, maxY: 4 }
    const subRegion = getSubQuadrant(region, { x: 1, y: 3 })
    expect(subRegion).toEqual({ minX: 0, maxX: 2, minY: 3, maxY: 4 })
  })
})

describe('isRegionSmallEnough', () => {
  it('returns true for 3x3 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 2, minY: 0, maxY: 2 })).toBe(true)
  })

  it('returns true for 2x2 region', () => {
    expect(isRegionSmallEnough({ minX: 5, maxX: 6, minY: 5, maxY: 6 })).toBe(true)
  })

  it('returns false for 4x4 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 3, minY: 0, maxY: 3 })).toBe(false)
  })

  it('returns false for 3x4 region', () => {
    expect(isRegionSmallEnough({ minX: 0, maxX: 2, minY: 0, maxY: 3 })).toBe(false)
  })
})

describe('subdivision hints', () => {
  it('returns quadrant hint on first wrong attempt', () => {
    const moves = [{ x: 3, y: 3, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 0, maxX: 8, minY: 0, maxY: 8 })
  })

  it('returns subdivision hint on second wrong attempt', () => {
    const moves = [{ x: 2, y: 2, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 0, maxX: 4, minY: 0, maxY: 4 })
  })

  it('returns exact hint when region is small enough', () => {
    const moves = [{ x: 1, y: 1, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('exact')
    expect(result.position).toEqual({ x: 1, y: 1 })
  })

  it('resets hint region after correct move', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(3, 3)

    const result = gm.validateMove(0, 0)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toEqual({ minX: 9, maxX: 18, minY: 9, maxY: 18 })
  })
})

describe('Wrong Attempts Tracking', () => {
  it('tracks wrong attempt positions for each move', () => {
    const moves = [{ x: 3, y: 3, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(5, 5)

    expect(gm.getWrongAttempts(0)).toEqual([
      { x: 10, y: 10 },
      { x: 5, y: 5 }
    ])
  })

  it('clears wrong attempts after correct move', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(3, 3)
    gm.validateMove(0, 0)

    expect(gm.getWrongAttempts(0)).toEqual([{ x: 10, y: 10 }])
    expect(gm.getWrongAttempts(1)).toEqual([{ x: 0, y: 0 }])
  })

  it('getDifficultMoves returns top N moves by attempt count', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' },
      { x: 10, y: 10, color: 'B' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(0, 0)
    gm.validateMove(0, 1)
    gm.validateMove(0, 2)
    gm.validateMove(3, 3)

    gm.validateMove(15, 15)

    gm.validateMove(0, 0)
    gm.validateMove(10, 10)

    const difficult = gm.getDifficultMoves(2)
    expect(difficult).toHaveLength(2)
    expect(difficult[0].moveIndex).toBe(0)
    expect(difficult[0].attemptCount).toBe(3)
    expect(difficult[1].moveIndex).toBe(2)
    expect(difficult[1].attemptCount).toBe(1)
  })
})

describe('getBoardAtPosition', () => {
  it('returns board state at given position', () => {
    const moves = [
      { x: 3, y: 3, color: 'B' },
      { x: 15, y: 15, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validateMove(15, 15)

    const boardAt0 = gm.getBoardAtPosition(0)
    const boardAt1 = gm.getBoardAtPosition(1)

    expect(boardAt0.isEmpty()).toBe(true)
    expect(boardAt1.get([3, 3])).toBe(1)
    expect(boardAt1.get([15, 15])).toBe(0)
  })

  it('returns null for invalid position', () => {
    const gm = new GameManager([{ x: 3, y: 3, color: 'B' }], 19)
    expect(gm.getBoardAtPosition(10)).toBeNull()
    expect(gm.getBoardAtPosition(-1)).toBeNull()
  })
})
