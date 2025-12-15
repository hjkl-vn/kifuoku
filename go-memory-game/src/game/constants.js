export const BOARD_SIZE = 19
export const GHOST_HINT_COUNT = 4
export const MAX_GHOST_GENERATION_ATTEMPTS = 100
export const GHOST_HINT_RADIUS = 4
export const HINT_LETTERS = ['A', 'B', 'C', 'D']
export const BORDER_FLASH_DURATION_MS = 500

export const PHASES = {
  UPLOAD: 'upload',
  STUDY: 'study',
  REPLAY: 'replay',
  COMPLETE: 'complete'
}

export const HINT_TYPES = {
  QUADRANT: 'quadrant',
  GHOST: 'ghost',
  TRIANGLE: 'triangle'
}

export function getQuadrant(x, y) {
  const horizontal = x < 9.5 ? 'left' : 'right'
  const vertical = y < 9.5 ? 'upper' : 'lower'
  return `${vertical} ${horizontal}`
}

export function getQuadrantVertices(quadrant) {
  const vertices = []

  const [vertical, horizontal] = quadrant.split(' ')
  const xRange = horizontal === 'left' ? [0, 9] : [10, 18]
  const yRange = vertical === 'upper' ? [0, 9] : [10, 18]

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
