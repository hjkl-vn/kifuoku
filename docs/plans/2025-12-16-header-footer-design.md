# Header and Footer Design

## Overview

Add a site-wide header with navigation and a minimal footer with social links.

## New Components

- `Header.jsx` - Logo + navigation tabs
- `Footer.jsx` - Social links
- `Layout.jsx` - Wraps pages with Header + Footer
- `UnderConstruction.jsx` - Placeholder page

## Routing

Add `react-router-dom` with routes:
- `/` - Current game flow (Upload → Study → Replay)
- `/daily` - Under construction
- `/library` - Under construction

## Header

```
┌─────────────────────────────────────────────┐
│ ⚫⚪    Daily    Library                     │
└─────────────────────────────────────────────┘
```

- Logo (⚫⚪) links to `/`
- Nav links for Daily and Library
- Active tab gets visual indicator
- Scrolls with page (not sticky)
- Left-aligned items

## Footer

```
┌─────────────────────────────────────────────┐
│            [GitHub icon]  [Mastodon icon]   │
└─────────────────────────────────────────────┘
```

- GitHub: https://github.com/csessh
- Mastodon: https://social.linux.pizza/@csessh
- Links open in new tab
- Icons centered, subtle hover states
- Sticks to bottom via flexbox min-height

## Under Construction Page

```
┌─────────────────────────────────────────────┐
│           🚧 Under Construction 🚧           │
│      This feature is coming soon.           │
└─────────────────────────────────────────────┘
```

- Centered message
- Receives page title as prop
