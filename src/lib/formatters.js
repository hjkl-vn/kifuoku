export function getPlayerSummary(gameInfo) {
  if (!gameInfo) return 'Game'
  const black = gameInfo.blackPlayer || 'Black'
  const blackRank = gameInfo.blackRank ? ` (${gameInfo.blackRank})` : ''
  const white = gameInfo.whitePlayer || 'White'
  const whiteRank = gameInfo.whiteRank ? ` (${gameInfo.whiteRank})` : ''
  return `${black}${blackRank} ⚫ vs ${white}${whiteRank} ⚪`
}
