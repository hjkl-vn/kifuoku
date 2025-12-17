const OGS_URL_PATTERN = /online-go\.com\/(?:game|api\/v1\/games)\/(\d+)/

export function extractGameId(url) {
  const match = url.match(OGS_URL_PATTERN)
  return match ? match[1] : null
}

export function isValidOgsUrl(url) {
  return OGS_URL_PATTERN.test(url)
}

export function buildSgfApiUrl(gameId) {
  return `https://online-go.com/api/v1/games/${gameId}/sgf`
}
