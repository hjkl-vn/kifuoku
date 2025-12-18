import { describe, it, expect } from 'vitest'
import { parseSGFToMoves, getBoardSize, getGameInfo } from '../sgf-parser.js'

describe('parseSGFToMoves', () => {
  it('parses simple game with black and white moves', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[dd];B[pq];W[dp])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(4)
    expect(moves[0]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 1 })
    expect(moves[1]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 2 })
    expect(moves[2]).toEqual({ x: 15, y: 16, color: 'B', moveNumber: 3 })
    expect(moves[3]).toEqual({ x: 3, y: 15, color: 'W', moveNumber: 4 })
  })

  it('parses game starting with white move', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];W[dd];B[pd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
    expect(moves[0]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 1 })
    expect(moves[1]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 2 })
  })

  it('returns empty array for game with no moves', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toEqual([])
  })

  it('skips pass moves (empty coordinate)', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[];B[dd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
    expect(moves[0].color).toBe('B')
    expect(moves[1].color).toBe('B')
    expect(moves[1].moveNumber).toBe(2)
  })

  it('skips pass moves (tt coordinate)', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[tt];B[dd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
  })

  it('parses coordinates at board edges', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[aa];W[ss])'
    const moves = parseSGFToMoves(sgf)

    expect(moves[0]).toEqual({ x: 0, y: 0, color: 'B', moveNumber: 1 })
    expect(moves[1]).toEqual({ x: 18, y: 18, color: 'W', moveNumber: 2 })
  })

  it('parses 9x9 board coordinates', () => {
    const sgf = '(;FF[4]GM[1]SZ[9];B[ee];W[cc])'
    const moves = parseSGFToMoves(sgf)

    expect(moves[0]).toEqual({ x: 4, y: 4, color: 'B', moveNumber: 1 })
    expect(moves[1]).toEqual({ x: 2, y: 2, color: 'W', moveNumber: 2 })
  })

  it('returns empty array for text without moves', () => {
    const moves = parseSGFToMoves('not valid sgf')
    expect(moves).toEqual([])
  })

  it('throws error for empty string', () => {
    expect(() => parseSGFToMoves('')).toThrow('SGF parsing failed')
  })

  it('throws error for null input', () => {
    expect(() => parseSGFToMoves(null)).toThrow('SGF parsing failed')
  })

  it('follows only the main branch (first child)', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd](;W[dd];B[pq])(;W[dp];B[pp]))'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(3)
    expect(moves[1]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 2 })
  })

  it('handles SGF with metadata in root node', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]PB[Black Player]PW[White Player];B[pd];W[dd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
  })
})

describe('getBoardSize', () => {
  it('returns 19 for standard board', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    expect(getBoardSize(sgf)).toBe(19)
  })

  it('returns 9 for 9x9 board', () => {
    const sgf = '(;FF[4]GM[1]SZ[9])'
    expect(getBoardSize(sgf)).toBe(9)
  })

  it('returns 13 for 13x13 board', () => {
    const sgf = '(;FF[4]GM[1]SZ[13])'
    expect(getBoardSize(sgf)).toBe(13)
  })

  it('defaults to 19 when SZ property is missing', () => {
    const sgf = '(;FF[4]GM[1])'
    expect(getBoardSize(sgf)).toBe(19)
  })

  it('defaults to 19 for invalid SGF', () => {
    expect(getBoardSize('invalid')).toBe(19)
  })

  it('defaults to 19 for empty string', () => {
    expect(getBoardSize('')).toBe(19)
  })
})

describe('getGameInfo', () => {
  it('extracts all game metadata', () => {
    const sgf = `(;FF[4]GM[1]SZ[19]
      PB[Lee Sedol]PW[AlphaGo]
      BR[9p]WR[9d]
      DT[2016-03-09]
      GN[Game 1]
      RE[W+Resign]
      RU[Chinese])`

    const info = getGameInfo(sgf)

    expect(info.blackPlayer).toBe('Lee Sedol')
    expect(info.whitePlayer).toBe('AlphaGo')
    expect(info.blackRank).toBe('9p')
    expect(info.whiteRank).toBe('9d')
    expect(info.date).toBe('2016-03-09')
    expect(info.gameName).toBe('Game 1')
    expect(info.result).toBe('W+Resign')
    expect(info.rules).toBe('Chinese')
  })

  it('returns null for missing properties', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]PB[Black])'
    const info = getGameInfo(sgf)

    expect(info.blackPlayer).toBe('Black')
    expect(info.whitePlayer).toBeNull()
    expect(info.blackRank).toBeNull()
    expect(info.whiteRank).toBeNull()
    expect(info.date).toBeNull()
    expect(info.gameName).toBeNull()
    expect(info.result).toBeNull()
    expect(info.rules).toBeNull()
  })

  it('returns object with null values for invalid SGF', () => {
    const info = getGameInfo('invalid')
    expect(info.blackPlayer).toBeNull()
    expect(info.whitePlayer).toBeNull()
  })

  it('returns empty object for empty string', () => {
    const info = getGameInfo('')
    expect(info).toEqual({})
  })

  it('handles result formats', () => {
    const sgf1 = '(;FF[4]GM[1]RE[B+2.5])'
    expect(getGameInfo(sgf1).result).toBe('B+2.5')

    const sgf2 = '(;FF[4]GM[1]RE[W+Time])'
    expect(getGameInfo(sgf2).result).toBe('W+Time')

    const sgf3 = '(;FF[4]GM[1]RE[0])'
    expect(getGameInfo(sgf3).result).toBe('0')
  })
})
