# PostHog Analytics Integration

## Goals

Track user behavior to answer three questions:

1. **Engagement** — Where do users drop off?
2. **Feature usage** — Which features are popular?
3. **Learning patterns** — How do users improve over time?

## Approach

- Minimal tracking: key milestones only
- Passive funnel tracking via phase transitions

## Events

### 1. game_loaded

Fires when a game enters Study phase.

| Property | Type | Description |
|----------|------|-------------|
| `source` | string | `"file"` or `"ogs"` |
| `board_size` | number | Board dimensions (9, 13, or 19) |
| `move_count` | number | Total moves in game |

### 2. replay_started

Fires when user starts Replay phase.

| Property | Type | Description |
|----------|------|-------------|
| `side` | string | `"black"`, `"white"`, or `"both"` |
| `range_length` | number | Moves in selected range |

### 3. replay_completed

Fires when user finishes Replay phase.

| Property | Type | Description |
|----------|------|-------------|
| `accuracy` | number | Percentage of correct first attempts |
| `wrong_move_count` | number | Total wrong attempts |
| `total_time_seconds` | number | Time from start to finish |
| `hints_used` | number | Total hints triggered |

### 4. game_reset

Fires when user clicks "Play Again" after completing.

| Property | Type | Description |
|----------|------|-------------|
| `previous_accuracy` | number | Accuracy from completed game |

### 5. new_game_started

Fires when user returns to Upload phase.

| Property | Type | Description |
|----------|------|-------------|
| `from_phase` | string | `"complete"` or `"study"` |

### 6. annotation_used

Fires each time user adds an annotation during Study phase. No properties. Event count indicates frequency.

## Funnel

```
game_loaded → replay_started → replay_completed → (game_reset | new_game_started)
```

Drop-off between `game_loaded` and `replay_started` reveals users who loaded a game but never replayed.

Drop-off between `replay_started` and `replay_completed` reveals users who abandoned mid-replay.
