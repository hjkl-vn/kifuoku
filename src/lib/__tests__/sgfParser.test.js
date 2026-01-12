import { describe, it, expect } from 'vitest'
import {
  parseSGF,
  parseSGFToMoves,
  getBoardSize,
  getGameInfo,
  getSetupStones
} from '../sgfParser.js'

describe('parseSGFToMoves', () => {
  it('parses simple game with black and white moves', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[dd];B[pq];W[dp])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(4)
    expect(moves[0]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 1, isPass: false })
    expect(moves[1]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 2, isPass: false })
    expect(moves[2]).toEqual({ x: 15, y: 16, color: 'B', moveNumber: 3, isPass: false })
    expect(moves[3]).toEqual({ x: 3, y: 15, color: 'W', moveNumber: 4, isPass: false })
  })

  it('parses game starting with white move', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];W[dd];B[pd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
    expect(moves[0]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 1, isPass: false })
    expect(moves[1]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 2, isPass: false })
  })

  it('returns empty array for game with no moves', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toEqual([])
  })

  it('includes isPass property on regular moves', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[dd])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(2)
    expect(moves[0].isPass).toBe(false)
    expect(moves[1].isPass).toBe(false)
  })

  it('parses coordinates at board edges', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[aa];W[ss])'
    const moves = parseSGFToMoves(sgf)

    expect(moves[0]).toEqual({ x: 0, y: 0, color: 'B', moveNumber: 1, isPass: false })
    expect(moves[1]).toEqual({ x: 18, y: 18, color: 'W', moveNumber: 2, isPass: false })
  })

  it('parses 9x9 board coordinates', () => {
    const sgf = '(;FF[4]GM[1]SZ[9];B[ee];W[cc])'
    const moves = parseSGFToMoves(sgf)

    expect(moves[0]).toEqual({ x: 4, y: 4, color: 'B', moveNumber: 1, isPass: false })
    expect(moves[1]).toEqual({ x: 2, y: 2, color: 'W', moveNumber: 2, isPass: false })
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
    expect(moves[1]).toEqual({ x: 3, y: 3, color: 'W', moveNumber: 2, isPass: false })
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

  it('defaults to 19 for invalid SGF text', () => {
    expect(getBoardSize('invalid')).toBe(19)
  })

  it('throws on empty string', () => {
    expect(() => getBoardSize('')).toThrow('Invalid SGF')
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

  it('returns object with null values for invalid SGF text', () => {
    const info = getGameInfo('invalid')
    expect(info.blackPlayer).toBeNull()
    expect(info.whitePlayer).toBeNull()
  })

  it('throws on empty string', () => {
    expect(() => getGameInfo('')).toThrow('Invalid SGF')
  })

  it('handles result formats', () => {
    const sgf1 = '(;FF[4]GM[1]RE[B+2.5])'
    expect(getGameInfo(sgf1).result).toBe('B+2.5')

    const sgf2 = '(;FF[4]GM[1]RE[W+Time])'
    expect(getGameInfo(sgf2).result).toBe('W+Time')

    const sgf3 = '(;FF[4]GM[1]RE[0])'
    expect(getGameInfo(sgf3).result).toBe('0')
  })

  it('extracts handicap from HA property', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9])'
    const info = getGameInfo(sgf)
    expect(info.handicap).toBe(9)
  })

  it('returns null handicap when not present', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const info = getGameInfo(sgf)
    expect(info.handicap).toBeNull()
  })

  it('extracts komi from KM property', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]KM[6.5])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBe(6.5)
  })

  it('extracts zero komi for handicap games', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9]KM[0.5])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBe(0.5)
  })

  it('returns null komi when not present', () => {
    const sgf = '(;FF[4]GM[1]SZ[19])'
    const info = getGameInfo(sgf)
    expect(info.komi).toBeNull()
  })
})

describe('getSetupStones', () => {
  it('returns empty array for game without setup stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19];B[pd];W[dd])'
    const stones = getSetupStones(sgf)
    expect(stones).toEqual([])
  })

  it('parses AB (Add Black) stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AB[dd][pd][dp][pp];W[qf])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(4)
    expect(stones).toContainEqual({ x: 3, y: 3, color: 'B' })
    expect(stones).toContainEqual({ x: 15, y: 3, color: 'B' })
    expect(stones).toContainEqual({ x: 3, y: 15, color: 'B' })
    expect(stones).toContainEqual({ x: 15, y: 15, color: 'B' })
  })

  it('parses AW (Add White) stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AW[dd][pd];B[dp])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(2)
    expect(stones).toContainEqual({ x: 3, y: 3, color: 'W' })
    expect(stones).toContainEqual({ x: 15, y: 3, color: 'W' })
  })

  it('parses both AB and AW stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]AB[dd][pd]AW[dp][pp];B[qf])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(4)
    expect(stones.filter((s) => s.color === 'B')).toHaveLength(2)
    expect(stones.filter((s) => s.color === 'W')).toHaveLength(2)
  })

  it('parses 9-stone handicap correctly', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[9]AB[jd][jp][dj][pj][jj][dd][pp][pd][dp];W[qq])'
    const stones = getSetupStones(sgf)

    expect(stones).toHaveLength(9)
    expect(stones.every((s) => s.color === 'B')).toBe(true)
  })

  it('returns empty array for invalid SGF text', () => {
    const stones = getSetupStones('invalid')
    expect(stones).toEqual([])
  })

  it('throws on empty string', () => {
    expect(() => getSetupStones('')).toThrow('Invalid SGF')
  })
})

describe('parseSGF', () => {
  it('parses all data in single call', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]PB[Black]PW[White]KM[6.5];B[pd];W[dd])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(2)
    expect(result.boardSize).toBe(19)
    expect(result.gameInfo.blackPlayer).toBe('Black')
    expect(result.gameInfo.komi).toBe(6.5)
    expect(result.setupStones).toEqual([])
  })

  it('parses handicap game with setup stones', () => {
    const sgf = '(;FF[4]GM[1]SZ[19]HA[4]KM[0.5]AB[dd][pd][dp][pp];W[qf])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(1)
    expect(result.moves[0].color).toBe('W')
    expect(result.boardSize).toBe(19)
    expect(result.gameInfo.handicap).toBe(4)
    expect(result.gameInfo.komi).toBe(0.5)
    expect(result.setupStones).toHaveLength(4)
  })

  it('throws error for empty SGF', () => {
    expect(() => parseSGF('')).toThrow('Invalid SGF')
  })

  it('returns empty moves for invalid SGF text', () => {
    const result = parseSGF('not valid')
    expect(result.moves).toEqual([])
    expect(result.boardSize).toBe(19)
  })
})

describe('pass moves', () => {
  it('parses pass move with empty coordinate', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[];B[dp])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(3)
    expect(result.moves[0]).toEqual({ x: 15, y: 3, color: 'B', moveNumber: 1, isPass: false })
    expect(result.moves[1]).toEqual({ color: 'W', moveNumber: 2, isPass: true })
    expect(result.moves[2]).toEqual({ x: 3, y: 15, color: 'B', moveNumber: 3, isPass: false })
  })

  it('parses pass move with tt coordinate', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[tt];B[dp])'
    const result = parseSGF(sgf)

    expect(result.moves).toHaveLength(3)
    expect(result.moves[1]).toEqual({ color: 'W', moveNumber: 2, isPass: true })
  })

  it('parseSGFToMoves includes pass moves', () => {
    const sgf = '(;GM[1]SZ[19];B[pd];W[];B[dp])'
    const moves = parseSGFToMoves(sgf)

    expect(moves).toHaveLength(3)
    expect(moves[1].isPass).toBe(true)
  })
})

describe('error handling consistency', () => {
  it('getBoardSize throws on empty string', () => {
    expect(() => getBoardSize('')).toThrow('Invalid SGF')
  })

  it('getSetupStones throws on empty string', () => {
    expect(() => getSetupStones('')).toThrow('Invalid SGF')
  })

  it('getGameInfo throws on empty string', () => {
    expect(() => getGameInfo('')).toThrow('Invalid SGF')
  })
})
