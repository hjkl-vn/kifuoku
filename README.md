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
| `VITE_POSTHOG_KEY` | PostHog project API key |
| `VITE_POSTHOG_HOST` | PostHog instance URL (defaults to US cloud) |

**Analytics (PostHog):**
- **Disabled by default** - analytics only runs when `VITE_POSTHOG_KEY` is set
- **To enable:** Set `VITE_POSTHOG_KEY` to your PostHog project API key
- **To disable:** Leave `VITE_POSTHOG_KEY` empty or remove it

Tracked events:
| Event | Description |
|-------|-------------|
| `game_loaded` | Game loaded from file or OGS URL |
| `replay_started` | User begins replay phase |
| `replay_completed` | User finishes replay (with accuracy, time, hints used) |
| `game_reset` | User restarts the same game |
| `new_game_started` | User loads a different game |
| `annotation_used` | User adds an annotation during study |

**How env vars are loaded:**

| Scenario | Source |
|----------|--------|
| `npm run dev` | `.env.local` (Vite auto-loads) |
| `docker compose --profile dev` | `.env.local` (via volume mount) |
| `docker compose --profile prod` | `.env` or shell environment |

For local development, copy `.env.example` to `.env.local`. For production Docker builds, use `.env` (docker compose auto-loads this) or pass variables via shell.

## Deployment

## Contributing

### How to Contribute

- **Bug reports:** Open an issue describing the bug, steps to reproduce, and expected behavior
- **Feature requests:** Open an issue or start a discussion describing the feature and use case
- **Questions:** Start a discussion in the repository's Discussions tab
- **Pull requests:** Fork the repo, create a branch, make your changes, and submit a PR

### Code Style

This project uses automated tooling to enforce consistent code style:

- **ESLint** for linting JavaScript/JSX
- **Prettier** for code formatting
- **Husky + lint-staged** for pre-commit hooks

Before submitting a PR, ensure your code passes all checks:

```bash
npm run lint          # Check for linting errors
npm run lint:fix      # Auto-fix linting errors
npm run format        # Format code with Prettier
npm run format:check  # Check formatting without modifying
```

### Tests

All tests must pass before submitting a PR:

```bash
npm test              # Run tests in watch mode
npm test -- --run     # Run tests once
```

### CI/CD

Pull requests to `main` trigger GitHub Actions that run:
- Unit tests (`npm test -- --run`)
- ESLint (`npm run lint`)
- Prettier format check (`npm run format:check`)

All checks must pass before merging.

### Contact

For questions or collaboration: **tdo@hjkl.vn**
