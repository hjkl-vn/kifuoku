# Handicap Stones Support - Design

## Problem

Handicap games don't display correctly. The handicap stones (placed via `AB` property in SGF) are ignored, resulting in White's first move appearing on an empty board.

Example SGF:
```
HA[9]
AB[jd][jp][dj][pj][jj][dd][pp][pd][dp]
;W[qq]
```

Current behavior: Board starts empty, first move is `W[qq]`.
Expected behavior: Board starts with 9 black stones, first move is `W[qq]`.

## Decision

Handicap stones are pre-placed on the board before replay starts. They are not part of the replay challenge - users only replay actual game moves.

## Changes

### 1. Parser (`src/lib/sgfParser.js`)

**New function `getSetupStones()`:**
- Parse `AB` (Add Black) from root node
- Parse `AW` (Add White) from root node
- Return array of `{ x, y, color }` objects

**Modify `getGameInfo()`:**
- Add `handicap` (from `HA` property)
- Add `komi` (from `KM` property)

### 2. GameManager (`src/game/gameManager.js`)

**Modify constructor:**
- Accept optional `setupStones` parameter
- Initialize board with setup stones pre-placed
- `boardHistory[0]` contains handicap stones instead of empty board

### 3. GameInfo Display (`src/components/GameInfo.jsx`)

**Add to details section:**
- Handicap (e.g., "9 stones")
- Komi (e.g., "0.5")

### 4. Wiring (`src/pages/HomePage.jsx`, `src/game/useGameController.js`)

- Parse setup stones in `handleFileLoaded`
- Pass through state to `GameWrapper`
- Pass to `useGameController` hook
- Pass to `GameManager` constructor

## Testing

**Parser tests:**
- `getSetupStones()` returns empty array for non-handicap games
- `getSetupStones()` parses `AB` stones correctly
- `getSetupStones()` parses `AW` stones
- `getGameInfo()` returns handicap and komi

**GameManager tests:**
- Constructor with setupStones places stones on initial board
- Study navigation starts from pre-populated board
- Replay works correctly with handicap starting position

**Stats integrity tests:**
- Setup stones do not count toward total move count
- A 9-handicap game with 100 moves reports `totalMoves: 100`, not 109
- Completion stats (accuracy, wrong moves, time) only track actual game moves
- Range selection (start/end) indexes into game moves, not setup stones
