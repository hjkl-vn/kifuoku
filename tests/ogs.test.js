import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractGameId, isValidOgsUrl, fetchOgsSgf } from '../src/lib/ogs.js'

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

describe('fetchOgsSgf', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('fetches SGF from API', async () => {
    const mockSgf = '(;FF[4]GM[1]SZ[19])'
    fetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve(mockSgf)
    })

    const result = await fetchOgsSgf('12345')

    expect(fetch).toHaveBeenCalledWith('https://online-go.com/api/v1/games/12345/sgf')
    expect(result).toBe(mockSgf)
  })

  it('throws on 404', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 404
    })

    await expect(fetchOgsSgf('99999')).rejects.toThrow('Game not found')
  })

  it('throws on network error', async () => {
    fetch.mockRejectedValue(new Error('Network error'))

    await expect(fetchOgsSgf('12345')).rejects.toThrow('Failed to connect')
  })
})
