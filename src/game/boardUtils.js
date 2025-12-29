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
