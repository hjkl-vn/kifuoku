import { describe, it, expect } from 'vitest'
import { extractGameId, isValidOgsUrl } from '../ogs.js'

describe('OGS URL parsing', () => {
  describe('extractGameId', () => {
    it('extracts ID from game URL', () => {
      expect(extractGameId('https://online-go.com/game/78153269')).toBe('78153269')
    })

    it('extracts ID from API URL', () => {
      expect(extractGameId('https://online-go.com/api/v1/games/78153269/sgf')).toBe('78153269')
    })

    it('handles URL without https', () => {
      expect(extractGameId('online-go.com/game/12345')).toBe('12345')
    })

    it('returns null for invalid URL', () => {
      expect(extractGameId('https://example.com/game/123')).toBe(null)
    })
  })

  describe('isValidOgsUrl', () => {
    it('returns true for valid game URL', () => {
      expect(isValidOgsUrl('https://online-go.com/game/78153269')).toBe(true)
    })

    it('returns true for valid API URL', () => {
      expect(isValidOgsUrl('https://online-go.com/api/v1/games/78153269/sgf')).toBe(true)
    })

    it('returns false for non-OGS URL', () => {
      expect(isValidOgsUrl('https://example.com')).toBe(false)
    })

    it('returns false for random text', () => {
      expect(isValidOgsUrl('hello world')).toBe(false)
    })
  })
})
