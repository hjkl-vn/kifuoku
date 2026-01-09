import { parse } from '@sabaki/sgf'

export function parseSGFToMoves(sgfContent) {
  try {
    const gameTree = parse(sgfContent)

    if (!gameTree || gameTree.length === 0) {
      throw new Error('Invalid SGF: no game tree found')
    }

    const rootNode = gameTree[0]
    const moves = []
    let moveNumber = 0

    function traverseNode(node) {
      if (!node) return

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

function parseSGFCoordinate(coord) {
  // 'tt' and empty strings represent pass moves in SGF format
  if (!coord || coord === '' || coord === 'tt') {
    return [null, null]
  }

  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0)

  return [x, y]
}

export function getSetupStones(sgfContent) {
  try {
    const gameTree = parse(sgfContent)

    if (!gameTree || gameTree.length === 0) {
      return []
    }

    const rootNode = gameTree[0]
    const stones = []

    if (rootNode.data.AB) {
      rootNode.data.AB.forEach((coord) => {
        const [x, y] = parseSGFCoordinate(coord)
        if (x !== null && y !== null) {
          stones.push({ x, y, color: 'B' })
        }
      })
    }

    if (rootNode.data.AW) {
      rootNode.data.AW.forEach((coord) => {
        const [x, y] = parseSGFCoordinate(coord)
        if (x !== null && y !== null) {
          stones.push({ x, y, color: 'W' })
        }
      })
    }

    return stones
  } catch (_error) {
    return []
  }
}

export function getBoardSize(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]

    if (rootNode.data.SZ) {
      return parseInt(rootNode.data.SZ[0])
    }

    return 19
  } catch (_error) {
    return 19
  }
}

export function getGameInfo(sgfContent) {
  try {
    const gameTree = parse(sgfContent)
    const rootNode = gameTree[0]
    const data = rootNode.data

    const sourceUrl = extractSourceUrl(data.PC?.[0]) || extractSourceUrl(data.SO?.[0]) || null

    return {
      blackPlayer: data.PB?.[0] || null,
      whitePlayer: data.PW?.[0] || null,
      blackRank: data.BR?.[0] || null,
      whiteRank: data.WR?.[0] || null,
      date: data.DT?.[0] || null,
      gameName: data.GN?.[0] || null,
      result: data.RE?.[0] || null,
      rules: data.RU?.[0] || null,
      handicap: data.HA?.[0] ? parseInt(data.HA[0]) : null,
      komi: data.KM?.[0] ? parseFloat(data.KM[0]) : null,
      sourceUrl
    }
  } catch (_error) {
    return {}
  }
}

function extractSourceUrl(value) {
  if (!value) return null
  const urlMatch = value.match(/https?:\/\/[^\s]+/)
  return urlMatch ? urlMatch[0] : null
}
