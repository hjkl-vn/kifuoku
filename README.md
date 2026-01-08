# Kifu-oku (棋譜憶)

Kifu-oku (棋譜憶) is a coined Japanese term combining 棋譜 (kifu), meaning "game record" with 憶 (oku), meaning "to remember" or "recollect", the same character found in 記憶 (kioku, "memory"). Together, 棋譜憶 suggests "recalling game records" or "kifu memory."

While Kifu-oku (棋譜憶) is not a word you'll find in a dictionary, the construction follows natural Japanese compounding patterns and its meaning is immediately apparent to readers familiar with the characters.

My friend, Nobu, said this name was great. I trust her.

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup with npm

```bash
npm install
cp .env.example .env.local  # Configure environment variables
npm run dev                  # http://localhost:5173
```

### Setup with Docker

```bash
docker compose --profile dev up    # http://localhost:8181
```

For production build:
```bash
docker compose --profile prod up   # http://localhost:9090
```

### Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_POSTHOG_KEY` | PostHog project API key (optional) |
| `VITE_POSTHOG_HOST` | PostHog instance URL (defaults to US cloud) |

**How env vars are loaded:**

| Scenario | Source |
|----------|--------|
| `npm run dev` | `.env.local` (Vite auto-loads) |
| `docker compose --profile dev` | `.env.local` (via volume mount) |
| `docker compose --profile prod` | `.env` or shell environment |

For local development, copy `.env.example` to `.env.local`. For production Docker builds, use `.env` (docker compose auto-loads this) or pass variables via shell.

## Deployment
