# Pass Button - Bug Fixes In Progress

## Status: Paused

## Completed Implementation
The pass button feature was implemented across these files:
- `src/lib/sgfParser.js` - Added `isPass: true/false` to all moves
- `src/game/gameManager.js` - Added `validatePass()`, modified `validateMove()`, `playOpponentMove()`, `studyNext()`
- `src/game/useGameController.js` - Exposed `validatePass()`
- `src/components/BottomBar.jsx` - Replaced cancel with pass button
- `src/components/RightPanel.jsx` - Added pass button in replay phase
- `src/components/ReplayPhase.jsx` - Wired up `handlePass`, keyboard listener (spacebar)

## Bugs Fixed

### Bug 1: TDZ Crash on "Replay All" (FIXED)
**Symptom:** Clicking "Replay All" crashed the site

**Root cause:** In `ReplayPhase.jsx`, the `useEffect` for keyboard listener (lines 86-96) referenced `handlePass` in its dependency array before `handlePass` was declared with `useCallback` at line 152. This caused a Temporal Dead Zone error.

**Fix:** Moved the keyboard event listener `useEffect` to after the `handlePass` definition (now at lines 168-178).

**Commit:** `b5878bf` - "fix: move keyboard listener useEffect after handlePass definition"

### Bug 2: Board interaction during opponent turn (FIXED)
**Symptom:** Users could select positions during opponent auto-play

**Root cause:** `handleVertexClick` didn't check `isUserTurn` before allowing position selection.

**Fix:** Added `!isUserTurn` check to early return in `handleVertexClick`:
```javascript
if (evt.button !== 0 || isComplete || !isUserTurn) return
```

**Commit:** `b28f0a5` - "fix: prevent board interaction when not user's turn"

## Bug 3: Move after pass not validated (TO FIX)

**Symptom:** After clicking pass (correctly or incorrectly), the immediate next move doesn't get validated and hinted if incorrect.

**Likely location:** `src/components/ReplayPhase.jsx` in `handlePass` function (lines 140-166)

**Investigation needed:**
1. Check if `scheduleOpponentMove()` is being called correctly after pass
2. Check if state is being reset properly after pass (`hintState`, `wrongAttemptsCurrentMove`)
3. Check if `replayPosition` advances correctly after pass
4. Verify the `validatePass()` return values match what `handlePass` expects

**Relevant code in handlePass:**
```javascript
const handlePass = useCallback(() => {
  if (isComplete || !gameManager.isUserMove(gameManager.replayPosition)) return

  const result = gameManager.validatePass()

  if (result.correct) {
    setHintState(null)
    setPendingMove(null)
    setBorderFlash('success')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)

    if (result.gameComplete) {
      setBottomPanelExpanded(true)
      trackCompletion(gameManager)
    } else if (!gameManager.isUserMove(gameManager.replayPosition)) {
      scheduleOpponentMove()
    }
  } else if (result.needHint) {
    setHintState(result)
    setPendingMove(null)
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  } else if (result.expectedStone) {
    setBorderFlash('error')
    setTimeout(() => setBorderFlash(null), BORDER_FLASH_DURATION_MS)
  }
}, [gameManager, isComplete, scheduleOpponentMove])
```

**Relevant code in validatePass (gameManager.js lines 322-370):**
```javascript
validatePass() {
  // Returns { correct: true } when pass is correct
  // Returns { correct: false, needHint: true, expectedStone: true } when stone expected
  // Increments replayPosition on correct pass
  // Resets wrongAttemptsCurrentMove on correct pass
}
```

**Hypothesis:** After a pass (correct or wrong), the component may not be re-rendering properly, or the `isUserTurn` state isn't updating, preventing the next move from being validated.

## Test File
`test-files/game-with-pass.sgf` contains a game with pass move for testing:
```
(;GM[1]FF[4]SZ[19]
PB[Black]PW[White]
;B[pd];W[dp];B[pp];W[];B[dd])
```
Moves: B[pd], W[dp], B[pp], W pass, B[dd]

## Git Branch
All changes are on branch `pass-button` (not yet merged to main)

## To Resume
1. Run `npm run dev` and test with `test-files/game-with-pass.sgf`
2. Test scenario: Click pass (when expected or not), then try placing next stone
3. Add console.log in `handlePass` and `commitMove` to trace execution
4. Check if `forceUpdate()` is being called after `validatePass()` in `useGameController.js`
