import { DEFAULT_BOARD_SIZE } from './constants'

export function createEmptyBoardMap(boardSize = DEFAULT_BOARD_SIZE) {
  return Array(boardSize).fill(null).map(() => Array(boardSize).fill(null))
}
