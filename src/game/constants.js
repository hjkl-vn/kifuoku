export const DEFAULT_BOARD_SIZE = 19
export const BORDER_FLASH_DURATION_MS = 500

export const MARKER_COLORS = {
  WRONG_ATTEMPT: '#c62828',
  CORRECT_POSITION: '#2e7d32'
}

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

export function getQuadrant(x, y, boardSize = DEFAULT_BOARD_SIZE) {
  const midpoint = boardSize / 2
  const horizontal = x < midpoint ? 'left' : 'right'
  const vertical = y < midpoint ? 'upper' : 'lower'
  return `${vertical} ${horizontal}`
}

export function getQuadrantVertices(quadrant, boardSize = DEFAULT_BOARD_SIZE) {
  const vertices = []
  const midpoint = Math.floor(boardSize / 2)

  const [vertical, horizontal] = quadrant.split(' ')
  const xRange = horizontal === 'left' ? [0, midpoint - 1] : [midpoint, boardSize - 1]
  const yRange = vertical === 'upper' ? [0, midpoint - 1] : [midpoint, boardSize - 1]

  for (let y = yRange[0]; y <= yRange[1]; y++) {
    for (let x = xRange[0]; x <= xRange[1]; x++) {
      vertices.push([x, y])
    }
  }

  return vertices
}

export function colorToSign(color) {
  if (color === 'B') return 1
  if (color === 'W') return -1
  return 0
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
