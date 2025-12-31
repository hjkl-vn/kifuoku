# Mobile Touch Confirmation Design

## Problem

On mobile layout, accidental touches on the board cause unintended moves during replay phase. Users need a way to confirm their intended move before committing.

## Solution

Add a tap-to-confirm pattern for mobile devices during replay phase. A single tap shows a pending move preview; the user must explicitly confirm or cancel via buttons.

## Interaction Flow

**Normal State (Mobile)**
- Bottom bar shows navigation buttons
- Board accepts tap input

**Pending State (triggered by tap on board)**
- Ghost stone appears at tapped intersection with pulsing animation
- Bottom bar swaps from navigation to Confirm/Cancel buttons
- Board still accepts taps to relocate pending stone

**User Actions in Pending State**
- **Tap Confirm** - Move commits, returns to normal state
- **Tap Cancel** - Pending cleared, returns to normal state
- **Tap different intersection** - Pending stone moves to new location, stays in pending state

**Desktop Behavior**
- No change - direct click-to-place remains

## Visual Design

**Pending Stone**
- Semi-transparent ghost stone at tapped intersection
- Pulsing animation: opacity cycles between ~40% and ~70% over ~1 second
- Uses current player's color (black or white)

**Bottom Bar in Pending State**
- Replaces navigation buttons entirely
- Two buttons side by side: Cancel (left) and Confirm (right)
- Confirm button uses primary/accent styling
- Cancel button uses secondary/muted styling
- Same height and styling as existing bottom bar

**Transition**
- Instant swap between navigation and confirm/cancel (no animation)
- Ghost stone appears immediately on tap

## Scope

**Included**
- Replay Phase - when user places memorized moves

**Excluded**
- Study Phase navigation (uses buttons, not board taps)
- Annotation tools (low stakes, easily undone)
- Desktop interactions (mouse is precise enough)

## Components Affected

- `Board.jsx` - Handle pending state, render ghost stone with pulsing animation
- `BottomBar.jsx` - Swap between navigation and confirm/cancel modes
- `useGameController.js` - Track pending move state, expose confirm/cancel actions
- `ReplayPhase.jsx` - Wire up the pending state flow

## Mobile Detection

Use existing 768px breakpoint for consistency with current responsive layout.

## Edge Cases

**Invalid Move Taps**
- Tapping occupied, suicide, or ko positions does not enter pending state
- Tap is ignored

**Pending State Persistence**
- Clears on confirm, cancel, or navigation away
- No timeout - user controls when to act

**State Shape**
```javascript
pendingMove: { x, y } | null
```

**Hint System**
- Pending state is independent of hint system
- Hints appear as normal; pending stone is the user's proposed answer
