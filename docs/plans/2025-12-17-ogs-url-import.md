# OGS URL Import Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow users to import games from online-go.com by pasting a URL.

**Architecture:** Add URL input to UploadPhase. On paste, validate URL format, extract game ID, fetch SGF from OGS API, pass to `onFileLoaded()`.

**Tech Stack:** React, native fetch API, regex for URL parsing.

---

### Task 1: URL Parsing Utility

**Files:**
- Create: `src/lib/ogs.js`
- Create: `src/lib/__tests__/ogs.test.js`

**Step 1: Write failing tests for URL parsing**

```javascript
// src/lib/__tests__/ogs.test.js
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
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/__tests__/ogs.test.js`
Expected: FAIL - module not found

**Step 3: Write implementation**

```javascript
// src/lib/ogs.js
const OGS_URL_PATTERN = /online-go\.com\/(?:game|api\/v1\/games)\/(\d+)/

export function extractGameId(url) {
  const match = url.match(OGS_URL_PATTERN)
  return match ? match[1] : null
}

export function isValidOgsUrl(url) {
  return OGS_URL_PATTERN.test(url)
}

export function buildSgfApiUrl(gameId) {
  return `https://online-go.com/api/v1/games/${gameId}/sgf`
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/ogs.test.js`
Expected: PASS (all 6 tests)

**Step 5: Commit**

```bash
git add src/lib/ogs.js src/lib/__tests__/ogs.test.js
git commit -m "feat: add OGS URL parsing utilities"
```

---

### Task 2: Fetch SGF Function

**Files:**
- Modify: `src/lib/ogs.js`
- Modify: `src/lib/__tests__/ogs.test.js`

**Step 1: Add failing tests for fetch function**

Add to `src/lib/__tests__/ogs.test.js`:

```javascript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { extractGameId, isValidOgsUrl, fetchOgsSgf } from '../ogs.js'

// Add after existing tests:

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
```

**Step 2: Run tests to verify they fail**

Run: `npm test -- --run src/lib/__tests__/ogs.test.js`
Expected: FAIL - fetchOgsSgf not exported

**Step 3: Add fetch implementation**

Add to `src/lib/ogs.js`:

```javascript
export async function fetchOgsSgf(gameId) {
  const url = buildSgfApiUrl(gameId)

  let response
  try {
    response = await fetch(url)
  } catch (err) {
    throw new Error('Failed to connect. Check your internet connection.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Game not found. Check the URL and try again.')
    }
    throw new Error('Failed to fetch game from OGS.')
  }

  return response.text()
}
```

**Step 4: Run tests to verify they pass**

Run: `npm test -- --run src/lib/__tests__/ogs.test.js`
Expected: PASS (all 9 tests)

**Step 5: Commit**

```bash
git add src/lib/ogs.js src/lib/__tests__/ogs.test.js
git commit -m "feat: add OGS SGF fetch function"
```

---

### Task 3: Add URL Input to UploadPhase

**Files:**
- Modify: `src/components/UploadPhase.jsx`
- Modify: `src/components/UploadPhase.module.css`

**Step 1: Add CSS styles for URL input section**

Add to end of `src/components/UploadPhase.module.css`:

```css
.divider {
  text-align: center;
  color: #999;
  margin: 20px 0;
  font-size: 14px;
}

.urlInput {
  width: 100%;
  padding: 15px;
  font-size: 16px;
  border: 2px solid #ccc;
  border-radius: 5px;
  box-sizing: border-box;
}

.urlInput:focus {
  outline: none;
  border-color: #4CAF50;
}

.urlInput:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.loading {
  text-align: center;
  color: #666;
  margin-top: 10px;
  font-size: 14px;
}
```

**Step 2: Commit CSS**

```bash
git add src/components/UploadPhase.module.css
git commit -m "style: add URL input styles to UploadPhase"
```

**Step 3: Update UploadPhase component**

Replace `src/components/UploadPhase.jsx` with:

```jsx
import React, { useState } from 'react'
import { isValidOgsUrl, extractGameId, fetchOgsSgf } from '../lib/ogs.js'
import styles from './UploadPhase.module.css'

export default function UploadPhase({ onFileLoaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleFile = async (file) => {
    setError(null)

    if (!file.name.endsWith('.sgf')) {
      setError('Please upload a .sgf file')
      return
    }

    try {
      const text = await file.text()
      onFileLoaded(text)
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleUrlPaste = async (e) => {
    const text = e.target.value
    if (!text) return

    setError(null)

    if (!isValidOgsUrl(text)) {
      setError('Please enter a valid online-go.com game URL')
      return
    }

    const gameId = extractGameId(text)
    setIsLoading(true)

    try {
      const sgf = await fetchOgsSgf(gameId)
      onFileLoaded(sgf)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const dropZoneClass = [
    styles.dropZone,
    dragOver ? styles.dropZoneActive : '',
    isLoading ? styles.disabled : ''
  ].filter(Boolean).join(' ')

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Go Memory Replay Game</h1>

      <div
        className={dropZoneClass}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={isLoading ? undefined : handleDrop}
      >
        <p className={styles.dropText}>
          Drop SGF file here
        </p>
        <p className={styles.orText}>or</p>
        <label className={styles.button}>
          Choose File
          <input
            type="file"
            accept=".sgf"
            onChange={handleFileInput}
            className={styles.fileInput}
            disabled={isLoading}
          />
        </label>
      </div>

      <p className={styles.divider}>─── or ───</p>

      <input
        type="text"
        className={styles.urlInput}
        placeholder="Paste online-go.com link here"
        onChange={handleUrlPaste}
        disabled={isLoading}
      />

      {isLoading && (
        <p className={styles.loading}>Loading game from OGS...</p>
      )}

      {error && (
        <p className={styles.error}>{error}</p>
      )}

      <div className={styles.info}>
        <p><strong>How to play:</strong></p>
        <ol>
          <li>Upload a Go game (SGF format)</li>
          <li>Study the game using prev/next buttons (or arrow keys)</li>
          <li>Replay the game from memory</li>
          <li>You'll get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}
```

**Step 4: Add disabled style for drop zone**

Add to `src/components/UploadPhase.module.css`:

```css
.disabled {
  opacity: 0.5;
  pointer-events: none;
}
```

**Step 5: Test manually**

Run: `npm run dev`
- Open browser
- Paste `https://online-go.com/game/78153269`
- Verify game loads

**Step 6: Commit**

```bash
git add src/components/UploadPhase.jsx src/components/UploadPhase.module.css
git commit -m "feat: add OGS URL import to UploadPhase"
```

---

### Task 4: Handle CORS (if needed)

**Files:**
- Modify: `src/lib/ogs.js`

If direct fetch fails due to CORS during manual testing:

**Step 1: Update fetch to use CORS proxy**

```javascript
export async function fetchOgsSgf(gameId) {
  const apiUrl = buildSgfApiUrl(gameId)
  const url = `https://corsproxy.io/?${encodeURIComponent(apiUrl)}`

  // ... rest unchanged
}
```

**Step 2: Test manually and commit if needed**

```bash
git add src/lib/ogs.js
git commit -m "fix: use CORS proxy for OGS fetch"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 1 | URL parsing utility | 6 |
| 2 | Fetch SGF function | 3 |
| 3 | UploadPhase UI | manual |
| 4 | CORS fix (if needed) | manual |

Total new tests: 9
