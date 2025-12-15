import { BOARD_SIZE } from './constants'

export function createEmptyBoardMap() {
  return Array(BOARD_SIZE).fill(null).map(() => Array(BOARD_SIZE).fill(null))
}
