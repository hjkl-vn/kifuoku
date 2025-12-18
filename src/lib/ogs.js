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

export async function fetchOgsSgf(gameId) {
  const url = buildSgfApiUrl(gameId)

  let response
  try {
    response = await fetch(url)
  } catch (_err) {
    throw new Error('Failed to connect. Check your internet connection.')
  }

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Game not found. Check the URL and try again.')
    }
    throw new Error('Failed to fetch game from OGS.')
  }

  return response.text()
}
