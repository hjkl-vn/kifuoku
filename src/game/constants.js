export const DEFAULT_BOARD_SIZE = 19
export const BORDER_FLASH_DURATION_MS = 500

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
