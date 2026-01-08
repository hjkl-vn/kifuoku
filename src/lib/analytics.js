import posthog from 'posthog-js'

const POSTHOG_KEY = import.meta.env.VITE_POSTHOG_KEY
const POSTHOG_HOST = import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com'

let analyticsEnabled = false

export function initAnalytics() {
  if (!POSTHOG_KEY) return

  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false,
    persistence: 'localStorage'
  })
  analyticsEnabled = true
}

export function trackGameLoaded({ source, boardSize, moveCount }) {
  if (!analyticsEnabled) return
  posthog.capture('game_loaded', {
    source,
    board_size: boardSize,
    move_count: moveCount
  })
}

export function trackReplayStarted({ side, rangeLength }) {
  if (!analyticsEnabled) return
  posthog.capture('replay_started', {
    side: side || 'both',
    range_length: rangeLength
  })
}

export function trackReplayCompleted({ accuracy, wrongMoveCount, totalTimeSeconds, hintsUsed }) {
  if (!analyticsEnabled) return
  posthog.capture('replay_completed', {
    accuracy,
    wrong_move_count: wrongMoveCount,
    total_time_seconds: totalTimeSeconds,
    hints_used: hintsUsed
  })
}

export function trackGameReset({ previousAccuracy }) {
  if (!analyticsEnabled) return
  posthog.capture('game_reset', {
    previous_accuracy: previousAccuracy
  })
}

export function trackNewGameStarted({ fromPhase }) {
  if (!analyticsEnabled) return
  posthog.capture('new_game_started', {
    from_phase: fromPhase
  })
}

export function trackAnnotationUsed() {
  if (!analyticsEnabled) return
  posthog.capture('annotation_used')
}
