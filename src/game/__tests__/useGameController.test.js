import { describe, it, expect, vi } from 'vitest'
import { renderHook, act } from '@testing-library/preact'
import useGameController from '../useGameController'

describe('useGameController', () => {
  const mockMoves = [
    { x: 3, y: 3, color: 'B' },
    { x: 15, y: 15, color: 'W' },
    { x: 3, y: 15, color: 'B' }
  ]

  describe('Initialization', () => {
    it('creates a wrapped GameManager with correct initial state', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.phase).toBe('study')
      expect(result.current.moves).toEqual(mockMoves)
      expect(result.current.boardSize).toBe(19)
      expect(result.current.studyPosition).toBe(0)
      expect(result.current.replayPosition).toBe(0)
      expect(result.current.stats.wrongMoveCount).toBe(0)
      expect(result.current.stats.correctFirstTry).toBe(0)
    })

    it('accepts setupStones parameter', () => {
      const setupStones = [
        { x: 3, y: 3, color: 'B' },
        { x: 15, y: 3, color: 'B' }
      ]
      const { result } = renderHook(() => useGameController(mockMoves, 19, setupStones))

      const initialBoard = result.current.getBoardAtPosition(0)
      expect(initialBoard.get([3, 3])).toBe(1)
      expect(initialBoard.get([15, 3])).toBe(1)
    })
  })

  describe('Study phase methods trigger re-renders', () => {
    it('studyNext triggers re-render and returns result', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      let returnValue
      act(() => {
        returnValue = result.current.studyNext()
      })

      expect(returnValue.success).toBe(true)
      expect(returnValue.position).toBe(1)
      expect(result.current.studyPosition).toBe(1)
    })

    it('studyPrev triggers re-render and returns result', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.studyNext()
        result.current.studyNext()
      })

      let returnValue
      act(() => {
        returnValue = result.current.studyPrev()
      })

      expect(returnValue.success).toBe(true)
      expect(returnValue.position).toBe(1)
      expect(result.current.studyPosition).toBe(1)
    })
  })

  describe('Replay phase methods trigger re-renders', () => {
    it('startReplay transitions to replay phase', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      let returnValue
      act(() => {
        returnValue = result.current.startReplay()
      })

      expect(returnValue.success).toBe(true)
      expect(result.current.phase).toBe('replay')
      expect(result.current.replayPosition).toBe(0)
    })

    it('validateMove triggers re-render', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
      })

      let returnValue
      act(() => {
        returnValue = result.current.validateMove(3, 3)
      })

      expect(returnValue.correct).toBe(true)
      expect(result.current.replayPosition).toBe(1)
    })

    it('validatePass triggers re-render', () => {
      const movesWithPass = [
        { x: 3, y: 3, color: 'B', isPass: false },
        { color: 'W', isPass: true },
        { x: 15, y: 15, color: 'B', isPass: false }
      ]
      const { result } = renderHook(() => useGameController(movesWithPass, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(3, 3)
      })

      let returnValue
      act(() => {
        returnValue = result.current.validatePass()
      })

      expect(returnValue.correct).toBe(true)
      expect(result.current.replayPosition).toBe(2)
    })

    it('playOpponentMove triggers re-render', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay(0, 2, 'W')
      })

      let returnValue
      act(() => {
        returnValue = result.current.playOpponentMove()
      })

      expect(returnValue.success).toBe(true)
      expect(result.current.replayPosition).toBe(1)
    })

    it('resetGame triggers re-render and returns to study phase', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(3, 3)
      })

      let returnValue
      act(() => {
        returnValue = result.current.resetGame()
      })

      expect(returnValue.success).toBe(true)
      expect(returnValue.phase).toBe('study')
      expect(result.current.phase).toBe('study')
      expect(result.current.studyPosition).toBe(0)
    })
  })

  describe('onStonePlace callback', () => {
    it('calls onStonePlace when studyNext succeeds', () => {
      const onStonePlace = vi.fn()
      const { result } = renderHook(() => useGameController(mockMoves, 19, [], { onStonePlace }))

      act(() => {
        result.current.studyNext()
      })

      expect(onStonePlace).toHaveBeenCalledTimes(1)
    })

    it('does not call onStonePlace when studyNext fails (end of moves)', () => {
      const onStonePlace = vi.fn()
      const { result } = renderHook(() => useGameController(mockMoves, 19, [], { onStonePlace }))

      act(() => {
        result.current.studyNext()
        result.current.studyNext()
        result.current.studyNext()
      })

      expect(onStonePlace).toHaveBeenCalledTimes(3)

      act(() => {
        result.current.studyNext()
      })

      expect(onStonePlace).toHaveBeenCalledTimes(3)
    })

    it('calls onStonePlace when validateMove is correct', () => {
      const onStonePlace = vi.fn()
      const { result } = renderHook(() => useGameController(mockMoves, 19, [], { onStonePlace }))

      act(() => {
        result.current.startReplay()
      })

      act(() => {
        result.current.validateMove(3, 3)
      })

      expect(onStonePlace).toHaveBeenCalledTimes(1)
    })

    it('does not call onStonePlace when validateMove is wrong', () => {
      const onStonePlace = vi.fn()
      const { result } = renderHook(() => useGameController(mockMoves, 19, [], { onStonePlace }))

      act(() => {
        result.current.startReplay()
      })

      act(() => {
        result.current.validateMove(10, 10)
      })

      expect(onStonePlace).not.toHaveBeenCalled()
    })

    it('calls onStonePlace when playOpponentMove succeeds', () => {
      const onStonePlace = vi.fn()
      const { result } = renderHook(() => useGameController(mockMoves, 19, [], { onStonePlace }))

      act(() => {
        result.current.startReplay(0, 2, 'W')
      })

      act(() => {
        result.current.playOpponentMove()
      })

      expect(onStonePlace).toHaveBeenCalledTimes(1)
    })
  })

  describe('Getter methods', () => {
    it('getCurrentBoard returns the board at current position', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      const board = result.current.getCurrentBoard()
      expect(board.isEmpty()).toBe(true)

      act(() => {
        result.current.studyNext()
      })

      const boardAfterMove = result.current.getCurrentBoard()
      expect(boardAfterMove.get([3, 3])).toBe(1)
    })

    it('getLastMove returns null at position 0', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.getLastMove()).toBeNull()
    })

    it('getLastMove returns the last played move', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.studyNext()
      })

      const lastMove = result.current.getLastMove()
      expect(lastMove).toEqual({ x: 3, y: 3, color: 'B' })
    })

    it('getCurrentTurn returns correct turn', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.getCurrentTurn()).toBe('B')

      act(() => {
        result.current.studyNext()
      })

      expect(result.current.getCurrentTurn()).toBe('W')
    })

    it('getState returns full game state', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      const state = result.current.getState()

      expect(state).toHaveProperty('phase', 'study')
      expect(state).toHaveProperty('studyPosition', 0)
      expect(state).toHaveProperty('replayPosition', 0)
      expect(state).toHaveProperty('totalMoves', 3)
      expect(state).toHaveProperty('boardSize', 19)
      expect(state).toHaveProperty('boardState')
      expect(state).toHaveProperty('stats')
      expect(state).toHaveProperty('oneColorMode', false)
    })

    it('getBoardAtPosition returns board at specific position', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.studyNext()
        result.current.studyNext()
      })

      const boardAt0 = result.current.getBoardAtPosition(0)
      const boardAt1 = result.current.getBoardAtPosition(1)

      expect(boardAt0.isEmpty()).toBe(true)
      expect(boardAt1.get([3, 3])).toBe(1)
      expect(boardAt1.get([15, 15])).toBe(0)
    })

    it('isValidPosition returns true for empty positions', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
      })

      expect(result.current.isValidPosition(10, 10)).toBe(true)
      expect(result.current.isValidPosition(0, 0)).toBe(true)
    })

    it('isValidPosition returns false for occupied positions', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(3, 3)
      })

      expect(result.current.isValidPosition(3, 3)).toBe(false)
    })

    it('isUserMove returns correct value based on replay side', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay(0, 2, 'B')
      })

      expect(result.current.isUserMove(0)).toBe(true)
      expect(result.current.isUserMove(1)).toBe(false)
      expect(result.current.isUserMove(2)).toBe(true)
    })

    it('isUserMove returns true for all moves when replaySide is null', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
      })

      expect(result.current.isUserMove(0)).toBe(true)
      expect(result.current.isUserMove(1)).toBe(true)
      expect(result.current.isUserMove(2)).toBe(true)
    })

    it('getReplaySide returns null before replay starts', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.getReplaySide()).toBeNull()
    })

    it('getReplaySide returns the selected side during replay', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay(0, 2, 'W')
      })

      expect(result.current.getReplaySide()).toBe('W')
    })
  })

  describe('Additional getter methods', () => {
    it('getCompletionStats returns completion statistics', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(3, 3)
        result.current.validateMove(15, 15)
        result.current.validateMove(3, 15)
      })

      const stats = result.current.getCompletionStats()
      expect(stats.totalMoves).toBe(3)
      expect(stats.correctFirstTry).toBe(3)
      expect(stats.accuracy).toBe(100)
    })

    it('getDifficultMoves returns moves sorted by wrong attempts', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(10, 10)
        result.current.validateMove(10, 11)
        result.current.validateMove(3, 3)
        result.current.validateMove(15, 15)
        result.current.validateMove(3, 15)
      })

      const difficult = result.current.getDifficultMoves()
      expect(difficult).toHaveLength(1)
      expect(difficult[0].moveIndex).toBe(0)
      expect(difficult[0].attemptCount).toBe(2)
    })

    it('getWrongAttempts returns wrong attempts for a specific move', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      act(() => {
        result.current.startReplay()
        result.current.validateMove(10, 10)
        result.current.validateMove(5, 5)
        result.current.validateMove(3, 3)
      })

      const wrongAttempts = result.current.getWrongAttempts(0)
      expect(wrongAttempts).toEqual([
        { x: 10, y: 10 },
        { x: 5, y: 5 }
      ])
    })
  })

  describe('Getter property accessors', () => {
    it('currentHintRegion returns the current hint region', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.currentHintRegion).toBeNull()

      act(() => {
        result.current.startReplay()
        result.current.validateMove(10, 10)
      })

      expect(result.current.currentHintRegion).toEqual({
        minX: 0,
        maxX: 8,
        minY: 0,
        maxY: 8
      })
    })

    it('wrongAttemptsCurrentMove tracks wrong attempts for current move', () => {
      const { result } = renderHook(() => useGameController(mockMoves, 19))

      expect(result.current.wrongAttemptsCurrentMove).toBe(0)

      act(() => {
        result.current.startReplay()
        result.current.validateMove(10, 10)
      })

      expect(result.current.wrongAttemptsCurrentMove).toBe(1)

      act(() => {
        result.current.validateMove(10, 11)
      })

      expect(result.current.wrongAttemptsCurrentMove).toBe(2)

      act(() => {
        result.current.validateMove(3, 3)
      })

      expect(result.current.wrongAttemptsCurrentMove).toBe(0)
    })
  })
})
