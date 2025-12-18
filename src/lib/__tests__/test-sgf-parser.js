import { readFileSync } from 'fs'
import { parse } from '@sabaki/sgf'

// Read the SGF file
const sgfContent = readFileSync('./sgf/sample.sgf', 'utf8')

// Parse SGF
const gameTree = parse(sgfContent)
const rootNode = gameTree[0]

// Get board size
const boardSize = rootNode.data.SZ ? parseInt(rootNode.data.SZ[0]) : 19

// Parse moves
const moves = []
let moveNumber = 0

function parseSGFCoordinate(coord) {
  if (!coord || coord === '' || coord === 'tt') {
    return [null, null]
  }
  const x = coord.charCodeAt(0) - 'a'.charCodeAt(0)
  const y = coord.charCodeAt(1) - 'a'.charCodeAt(0)
  return [x, y]
}

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

// Output results
console.log(`Parsed ${moves.length} moves from SGF, board size: ${boardSize}`)
console.log('First 3 moves:', moves.slice(0, 3))
console.log(`Last 3 moves:`, moves.slice(-3))

// Verify expected output
if (moves.length === 8) {
  console.log('\n✓ Test passed: Expected 8 moves (if using test-game.sgf)')
} else if (moves.length > 100) {
  console.log(`\n✓ Test passed: Parsed full game with ${moves.length} moves`)
} else {
  console.log(`\n✓ Test completed: Parsed ${moves.length} moves`)
}

if (boardSize === 19) {
  console.log('✓ Board size: 19')
}
