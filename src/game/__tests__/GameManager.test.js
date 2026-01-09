import { describe, it, expect } from 'vitest'
import GameManager from '../gameManager'
import { getQuadrantBounds, getSubQuadrant, isRegionSmallEnough } from '../boardUtils'

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

    it('accepts setupStones and pre-populates initial board', () => {
      const setupStones = [
        { x: 3, y: 3, color: 'B' },
        { x: 15, y: 3, color: 'B' },
        { x: 3, y: 15, color: 'B' },
        { x: 15, y: 15, color: 'B' }
      ]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.get([3, 3])).toBe(1)
      expect(initialBoard.get([15, 3])).toBe(1)
      expect(initialBoard.get([3, 15])).toBe(1)
      expect(initialBoard.get([15, 15])).toBe(1)
    })

    it('initial board is not empty when setupStones provided', () => {
      const setupStones = [{ x: 9, y: 9, color: 'B' }]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.isEmpty()).toBe(false)
    })

    it('works with empty setupStones array', () => {
      const manager = new GameManager(mockMoves, 19, [])
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.isEmpty()).toBe(true)
    })

    it('handles white setup stones', () => {
      const setupStones = [{ x: 3, y: 3, color: 'W' }]
      const manager = new GameManager(mockMoves, 19, setupStones)
      const initialBoard = manager.getCurrentBoard()

      expect(initialBoard.get([3, 3])).toBe(-1)
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

    it('studyNext handles pass moves without crashing', () => {
      const movesWithPass = [
        { x: 3, y: 3, color: 'B', isPass: false },
        { color: 'W', isPass: true },
        { x: 15, y: 15, color: 'B', isPass: false }
      ]
      const manager = new GameManager(movesWithPass)

      const result1 = manager.studyNext()
      expect(result1.success).toBe(true)
      expect(manager.studyPosition).toBe(1)
      expect(manager.getCurrentBoard().get([3, 3])).toBe(1)

      const result2 = manager.studyNext()
      expect(result2.success).toBe(true)
      expect(result2.move.isPass).toBe(true)
      expect(manager.studyPosition).toBe(2)

      const result3 = manager.studyNext()
      expect(result3.success).toBe(true)
      expect(manager.studyPosition).toBe(3)
      expect(manager.getCurrentBoard().get([15, 15])).toBe(1)
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

  it('continues showing exact hint on subsequent wrong clicks', () => {
    const moves = [{ x: 1, y: 1, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)

    const result1 = gm.validateMove(5, 5)
    expect(result1.correct).toBe(false)
    expect(result1.hintType).toBe('exact')
    expect(result1.position).toEqual({ x: 1, y: 1 })

    const result2 = gm.validateMove(0, 0)
    expect(result2.correct).toBe(false)
    expect(result2.hintType).toBe('exact')

    expect(gm.replayPosition).toBe(0)
  })

  it('only advances move when clicking exact hint position', () => {
    const moves = [
      { x: 1, y: 1, color: 'B' },
      { x: 10, y: 10, color: 'W' }
    ]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)
    gm.validateMove(10, 10)

    expect(gm.replayPosition).toBe(0)

    const result = gm.validateMove(1, 1)
    expect(result.correct).toBe(true)
    expect(gm.replayPosition).toBe(1)
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

  it('never advances position without correct click even with many wrong attempts', () => {
    const moves = [{ x: 5, y: 5, color: 'B' }]
    const gm = new GameManager(moves, 19)
    gm.startReplay()

    const wrongPositions = [
      [0, 0],
      [18, 18],
      [0, 18],
      [18, 0],
      [10, 10],
      [3, 3],
      [7, 7],
      [4, 4],
      [6, 6],
      [5, 4],
      [4, 5],
      [6, 5],
      [5, 6]
    ]

    let gotExactHint = false
    for (const [x, y] of wrongPositions) {
      const result = gm.validateMove(x, y)
      expect(result.correct).toBe(false)
      expect(gm.replayPosition).toBe(0)

      if (result.hintType === 'exact') {
        gotExactHint = true
        expect(result.position).toEqual({ x: 5, y: 5 })
      }
    }

    expect(gotExactHint).toBe(true)
    expect(gm.replayPosition).toBe(0)

    const correctResult = gm.validateMove(5, 5)
    expect(correctResult.correct).toBe(true)
    expect(gm.replayPosition).toBe(1)
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

describe('Single-Side Replay', () => {
  const mockMoves = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 15, color: 'W' },
    { x: 3, y: 15, color: 'B' },
    { x: 15, y: 3, color: 'W' }
  ]

  describe('isUserMove', () => {
    it('returns true for all moves when replaySide is null', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay()

      expect(gm.isUserMove(0)).toBe(true)
      expect(gm.isUserMove(1)).toBe(true)
      expect(gm.isUserMove(2)).toBe(true)
    })

    it('returns true only for black moves when replaySide is B', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      expect(gm.isUserMove(0)).toBe(true)
      expect(gm.isUserMove(1)).toBe(false)
      expect(gm.isUserMove(2)).toBe(true)
      expect(gm.isUserMove(3)).toBe(false)
    })

    it('returns true only for white moves when replaySide is W', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'W')

      expect(gm.isUserMove(0)).toBe(false)
      expect(gm.isUserMove(1)).toBe(true)
      expect(gm.isUserMove(2)).toBe(false)
      expect(gm.isUserMove(3)).toBe(true)
    })
  })

  describe('playOpponentMove', () => {
    it('plays the current move and advances position', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'W')

      const result = gm.playOpponentMove()

      expect(result.success).toBe(true)
      expect(result.move).toEqual({ x: 3, y: 3, color: 'B' })
      expect(gm.replayPosition).toBe(1)
      expect(gm.getCurrentBoard().get([3, 3])).toBe(1)
    })

    it('does not update stats', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'W')

      gm.playOpponentMove()

      expect(gm.stats.correctFirstTry).toBe(0)
      expect(gm.stats.wrongMoveCount).toBe(0)
    })

    it('returns error if called on user move', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      const result = gm.playOpponentMove()

      expect(result.error).toBe('Current move is not opponent move')
    })

    it('handles consecutive opponent moves', () => {
      const moves = [
        { x: 3, y: 3, color: 'W' },
        { x: 15, y: 15, color: 'W' },
        { x: 10, y: 10, color: 'B' }
      ]
      const gm = new GameManager(moves)
      gm.startReplay(0, 2, 'B')

      gm.playOpponentMove()
      const result = gm.playOpponentMove()

      expect(result.success).toBe(true)
      expect(gm.replayPosition).toBe(2)
    })
  })

  describe('stats tracking', () => {
    it('counts only user moves for correctFirstTry', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      gm.validateMove(3, 3)
      gm.playOpponentMove()
      gm.validateMove(3, 15)
      gm.playOpponentMove()

      expect(gm.stats.correctFirstTry).toBe(2)
    })

    it('getCompletionStats returns only user move count', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      gm.validateMove(3, 3)
      gm.playOpponentMove()
      gm.validateMove(3, 15)
      gm.playOpponentMove()

      const stats = gm.getCompletionStats()
      expect(stats.totalMoves).toBe(2)
    })

    it('calculates accuracy from user moves only', () => {
      const gm = new GameManager(mockMoves)
      gm.startReplay(0, 3, 'B')

      gm.validateMove(3, 3)
      gm.playOpponentMove()
      gm.validateMove(0, 0)
      gm.validateMove(3, 15)
      gm.playOpponentMove()

      const stats = gm.getCompletionStats()
      expect(stats.accuracy).toBe(50)
    })
  })
})

describe('Pass Move Validation', () => {
  const movesWithPass = [
    { x: 3, y: 3, color: 'B', isPass: false },
    { color: 'W', isPass: true },
    { x: 15, y: 15, color: 'B', isPass: false }
  ]

  it('validatePass returns correct when expected move is pass', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validatePass()

    expect(result.correct).toBe(true)
    expect(gm.replayPosition).toBe(2)
  })

  it('validatePass returns wrong when expected move is stone placement', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()

    const result = gm.validatePass()

    expect(result.correct).toBe(false)
    expect(result.needHint).toBe(true)
    expect(result.expectedStone).toBe(true)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toBeDefined()
    expect(gm.replayPosition).toBe(0)
    expect(gm.currentHintRegion).toEqual(result.region)
  })

  it('validateMove on stone when expected is pass flashes error without quadrant hint', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.expectedPass).toBe(true)
    expect(result.hintType).toBeUndefined()
  })

  it('pass moves count toward stats', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validatePass()
    gm.validateMove(15, 15)

    expect(gm.stats.correctFirstTry).toBe(3)
  })

  it('wrong pass attempt increments wrongMoveCount', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()

    gm.validatePass()

    expect(gm.stats.wrongMoveCount).toBe(1)
  })

  it('validateMove after wrong pass attempt provides subdivision hint', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()

    gm.validatePass()

    const result = gm.validateMove(10, 10)

    expect(result.correct).toBe(false)
    expect(result.hintType).toBe('quadrant')
    expect(result.region).toBeDefined()
    expect(gm.stats.wrongMoveCount).toBe(2)
  })

  it('pass moves are not added to difficult moves', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay()
    gm.validateMove(3, 3)
    gm.validateMove(10, 10)
    gm.validatePass()
    gm.validateMove(15, 15)

    const difficult = gm.getDifficultMoves()
    expect(difficult).toHaveLength(0)
  })

  it('playOpponentMove handles opponent pass', () => {
    const gm = new GameManager(movesWithPass)
    gm.startReplay(0, 2, 'B')
    gm.validateMove(3, 3)

    const result = gm.playOpponentMove()

    expect(result.success).toBe(true)
    expect(result.move.isPass).toBe(true)
    expect(gm.replayPosition).toBe(2)
  })

  it('game completes when final move is pass', () => {
    const movesEndingInPass = [
      { x: 3, y: 3, color: 'B', isPass: false },
      { color: 'W', isPass: true }
    ]
    const gm = new GameManager(movesEndingInPass)
    gm.startReplay()
    gm.validateMove(3, 3)

    const result = gm.validatePass()

    expect(result.correct).toBe(true)
    expect(result.gameComplete).toBe(true)
    expect(gm.phase).toBe('complete')
  })
})

describe('Handicap Game Stats Integrity', () => {
  const handicapSetupStones = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 3, color: 'B' },
    { x: 3, y: 15, color: 'B' },
    { x: 15, y: 15, color: 'B' }
  ]

  const handicapMoves = [
    { x: 16, y: 2, color: 'W' },
    { x: 2, y: 16, color: 'B' },
    { x: 16, y: 16, color: 'W' }
  ]

  it('totalMoves reflects game moves, not setup stones', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
    const state = manager.getState()

    expect(state.totalMoves).toBe(3)
  })

  it('setup stones do not affect move count in completion stats', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
    manager.startReplay(0, 2)

    manager.validateMove(16, 2)
    manager.validateMove(2, 16)
    manager.validateMove(16, 16)

    const stats = manager.getCompletionStats()
    expect(stats.totalMoves).toBe(3)
  })

  it('accuracy calculation is based on game moves only', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
    manager.startReplay(0, 2)

    manager.validateMove(16, 2)
    manager.validateMove(2, 16)
    manager.validateMove(16, 16)

    const stats = manager.getCompletionStats()
    expect(stats.accuracy).toBe(100)
    expect(stats.correctFirstTry).toBe(3)
  })

  it('study navigation works correctly with setup stones', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)

    expect(manager.studyPosition).toBe(0)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)

    manager.studyNext()
    expect(manager.studyPosition).toBe(1)
    expect(manager.getCurrentBoard().get([16, 2])).toBe(-1)
    expect(manager.getCurrentBoard().get([3, 3])).toBe(1)
  })

  it('range selection indexes into game moves, not setup stones', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
    manager.startReplay(1, 2)

    expect(manager.replayStartMove).toBe(1)
    expect(manager.replayEndMove).toBe(2)

    const firstMoveToReplay = manager.moves[manager.replayPosition]
    expect(firstMoveToReplay.color).toBe('B')
    expect(firstMoveToReplay.x).toBe(2)
  })

  it('wrong move count only tracks game moves', () => {
    const manager = new GameManager(handicapMoves, 19, handicapSetupStones)
    manager.startReplay(0, 2)

    manager.validateMove(0, 0)
    manager.validateMove(16, 2)
    manager.validateMove(2, 16)
    manager.validateMove(16, 16)

    const stats = manager.getCompletionStats()
    expect(stats.wrongMoveCount).toBe(1)
    expect(stats.correctFirstTry).toBe(2)
  })
})
