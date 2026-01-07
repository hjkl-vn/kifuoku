import { DEFAULT_BOARD_SIZE } from './constants'

export function createEmptyBoardMap(boardSize = DEFAULT_BOARD_SIZE) {
  return Array(boardSize)
    .fill(null)
    .map(() => Array(boardSize).fill(null))
}

export function getQuadrantBounds(move, boardSize) {
  const midX = Math.floor(boardSize / 2)
  const midY = Math.floor(boardSize / 2)
  return {
    minX: move.x < midX ? 0 : midX,
    maxX: move.x < midX ? midX - 1 : boardSize - 1,
    minY: move.y < midY ? 0 : midY,
    maxY: move.y < midY ? midY - 1 : boardSize - 1
  }
}

export function getSubQuadrant(region, move) {
  const midX = Math.floor((region.minX + region.maxX) / 2)
  const midY = Math.floor((region.minY + region.maxY) / 2)
  return {
    minX: move.x <= midX ? region.minX : midX + 1,
    maxX: move.x <= midX ? midX : region.maxX,
    minY: move.y <= midY ? region.minY : midY + 1,
    maxY: move.y <= midY ? midY : region.maxY
  }
}

export function isRegionSmallEnough(region) {
  const width = region.maxX - region.minX + 1
  const height = region.maxY - region.minY + 1
  return width <= 3 && height <= 3
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
