# Single-Side Replay Mode

## Overview

Users can replay as one color (Black or White) while the system auto-plays opponent moves. This lets players practice recalling only their own moves.

## User Flow

1. User studies the game and selects move range
2. Three buttons appear: "Replay" (both sides), "Replay as Black", "Replay as White"
3. User picks a side
4. Replay begins:
   - User's turn: wait for input, timer runs
   - Opponent's turn: system auto-plays after 500-1000ms random delay, timer pauses
5. When playing as White, Black's first move auto-plays immediately on start

## UI Changes

### New Buttons (StudyPhase)

Add two buttons alongside existing "Replay" button:

| Button | Style | Label |
|--------|-------|-------|
| Black | Dark background, light text | "Replay as {playerName}" or "Replay as Black" |
| White | Light background, dark text, border | "Replay as {playerName}" or "Replay as White" |

### During Replay

- Progress bar shows all moves, advances on both user and auto-played moves
- Auto-played moves render with same animation as user moves (stone placement, last-move marker, captures)
- Hint system unchanged (only triggers on user's wrong moves)

## Stats Tracking

Stats count only user moves:

- `totalMoves`: moves user recalled (not total game moves)
- `correctFirstTry`: user moves correct on first attempt
- `wrongMoveCount`: user's wrong attempts only
- `moveTimes`: time per user move only
- Timer runs only during user's turn

## GameManager Changes

### New State

```javascript
this.replaySide = null  // null = both, 'black', or 'white'
```

### Modified Methods

**`startReplay(startMove, endMove, side)`**
- Accept `side` parameter
- Store `this.replaySide = side`
- If playing as White, queue Black's first move for auto-play

**`validateMove(x, y)`**
- Unchanged for user moves
- Stats update only when move belongs to user's side

### New Methods

**`isUserMove(position)`**
- Returns true if move at position matches `replaySide`
- Returns true for all moves when `replaySide` is null

**`playOpponentMove()`**
- Plays move at current `replayPosition`
- Updates board and advances position
- Skips all stat tracking
- Triggers same board animation as user moves

## useGameController Changes

Handle auto-play timing:

```javascript
const autoPlayOpponent = useCallback(() => {
  const delay = 500 + Math.random() * 500
  setTimeout(() => {
    gameManager.playOpponentMove()
    // Check if next move is also opponent's
    if (isOpponentTurn()) {
      autoPlayOpponent()
    }
  }, delay)
}, [gameManager])
```

After user completes a move, check if next is opponent's turn and trigger auto-play.

## Files to Modify

1. `src/game/gameManager.js` - state, methods, stats logic
2. `src/game/useGameController.js` - auto-play timing, turn checking
3. `src/components/StudyPhase.jsx` - new buttons, styling
4. `src/game/constants.js` - add side constants if needed
