export const DEFAULT_BOARD_SIZE = 19
export const BORDER_FLASH_DURATION_MS = 500

export const HOLD_TO_REPEAT_DELAY_MS = 300
export const HOLD_TO_REPEAT_INTERVAL_MS = 200

export const OPPONENT_MOVE_BASE_DELAY_MS = 500
export const OPPONENT_MOVE_RANDOM_DELAY_MS = 500

export const PANEL_Z_INDEX_DELAY_MS = 300

export const ANNOTATION_TOOLS = [
  { id: 'circle', label: '○', title: 'Circle' },
  { id: 'triangle', label: '△', title: 'Triangle' },
  { id: 'cross', label: '✕', title: 'Cross' },
  { id: 'label', label: 'A', title: 'Label' }
]

export const PHASES = {
  UPLOAD: 'upload',
  STUDY: 'study',
  REPLAY: 'replay',
  COMPLETE: 'complete'
}

export const HINT_TYPES = {
  QUADRANT: 'quadrant',
  EXACT: 'exact'
}
