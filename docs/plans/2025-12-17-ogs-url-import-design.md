# OGS URL Import Feature

Import Go games directly from online-go.com by pasting a game URL.

## User Interface

Add a URL input field below the existing drop zone in UploadPhase:

```
┌─────────────────────────────────┐
│     Drop SGF file here          │
│            or                   │
│       [Choose File]             │
└─────────────────────────────────┘

           ─── or ───

┌─────────────────────────────────┐
│ Paste online-go.com link here   │
└─────────────────────────────────┘
```

The input auto-fetches on paste. No button required.

## URL Processing

**Supported formats:**
- `https://online-go.com/game/12345`
- `https://online-go.com/api/v1/games/12345/sgf`

**Validation:**
Extract game ID using regex: `online-go\.com/(game|api/v1/games)/(\d+)`

**Fetch:**
GET `https://online-go.com/api/v1/games/{id}/sgf`

On success, pass SGF content to `onFileLoaded()`.

## Loading State

- Show loading indicator while fetching
- Disable drop zone and file input during fetch

## Error Messages

| Scenario | Message |
|----------|---------|
| Invalid URL format | "Please enter a valid online-go.com game URL" |
| Network error | "Failed to connect. Check your internet connection." |
| Game not found (404) | "Game not found. Check the URL and try again." |
| CORS blocked | "Unable to fetch from OGS. Try downloading the SGF file directly." |
| Invalid SGF response | "The response wasn't a valid SGF file." |

## CORS Contingency

If direct fetch fails due to CORS, try a public proxy (`https://corsproxy.io/?url=...`) or add a backend proxy.

## Implementation

**Files to modify:**
- `src/components/UploadPhase.jsx` - URL input, fetch logic, loading/error states
- `src/components/UploadPhase.module.css` - URL input styles

**New state:**
- `urlInput` - input value
- `isLoading` - fetch in progress
- `error` - reuse existing (covers both file and URL errors)

**New function:**
- `handleUrlPaste(e)` - validate, extract ID, fetch SGF, call `onFileLoaded()`

No new dependencies required.
