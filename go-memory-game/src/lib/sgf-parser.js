import { parse } from '@sabaki/sgf'

/**
 * Parse SGF file content to move list
 * @param {string} sgfContent - Raw SGF file content
 * @returns {Array} Array of moves: [{x, y, color, moveNumber}, ...]
 */
export function parseSGFToMoves(sgfContent) {
  try {
    const gameTree = parse(sgfContent)

    if (!gameTree || gameTree.length === 0) {
      throw new Error('Invalid SGF: no game tree found')
    }

    const rootNode = gameTree[0]
    const moves = []
    let moveNumber = 0

    // Traverse game tree depth-first
    function traverseNode(node) {
      if (!node) return

      // Check for move (B or W property)
      const blackMove = node.data.B
      const whiteMove = node.data.W

      if (blackMove) {
        const [x, y] = parseSGFCoordinate(blackMove[0])
        if (x !== null && y !== null) {
          moveNumber++
          moves.push({ x, y, color: 'B', moveNumber })
        }
      }

      if (whiteMove) {
        const [x, y] = parseSGFCoordinate(whiteMove[0])
        if (x !== null && y !== null) {
          moveNumber++
          moves.push({ x, y, color: 'W', moveNumber })
        }
      }

      // Continue with first child
      if (node.children && node.children.length > 0) {
        traverseNode(node.children[0])
      }
    }

    traverseNode(rootNode)

    return moves
  } catch (error) {
    throw new Error(`SGF parsing failed: ${error.message}`)
  }
}

/**
 * Convert SGF coordinate string to [x, y]
 * SGF uses lowercase letters: 'a' = 0, 'b' = 1, etc.
 * Empty string or 'tt' means pass, return [null, null]
 */
function parseSGFCoordinate(coord) {
  if (!coord || coord === '' || coord === 'tt') {
    return [null, null]
  }

  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0)

  return [x, y]
}

export function getBoardSize(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]

    if (rootNode.data.SZ) {
      return parseInt(rootNode.data.SZ[0])
    }

    return 19
  } catch (error) {
    return 19
  }
}

export function getGameInfo(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]
    const data = rootNode.data

    return {
      blackPlayer: data.PB?.[0] || null,
      whitePlayer: data.PW?.[0] || null,
      blackRank: data.BR?.[0] || null,
      whiteRank: data.WR?.[0] || null,
      date: data.DT?.[0] || null,
      gameName: data.GN?.[0] || null,
      result: data.RE?.[0] || null,
      rules: data.RU?.[0] || null
    }
  } catch (error) {
    return {}
  }
}
