export function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000)

  if (totalSeconds < 60) {
    const decimal = (ms / 1000).toFixed(1)
    return `${decimal} second${decimal === '1.0' ? '' : 's'}`
  }

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  const parts = []
  if (hours > 0) {
    parts.push(`${hours} hour${hours === 1 ? '' : 's'}`)
  }
  if (minutes > 0) {
    parts.push(`${minutes} minute${minutes === 1 ? '' : 's'}`)
  }
  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds} second${seconds === 1 ? '' : 's'}`)
  }

  return parts.join(', ')
}

export function getPlayerSummary(gameInfo) {
  if (!gameInfo) return 'Game'
  const black = gameInfo.blackPlayer || 'Black'
  const blackRank = gameInfo.blackRank ? ` (${gameInfo.blackRank})` : ''
  const white = gameInfo.whitePlayer || 'White'
  const whiteRank = gameInfo.whiteRank ? ` (${gameInfo.whiteRank})` : ''
  return `${black}${blackRank} ⚫ vs ${white}${whiteRank} ⚪`
}
