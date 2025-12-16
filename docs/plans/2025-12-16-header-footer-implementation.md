# Header and Footer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add site-wide header with navigation tabs and minimal footer with social links.

**Architecture:** Install react-router-dom for routing, create Layout wrapper component that renders Header/Footer around page content, add placeholder pages for Daily/Library routes.

**Tech Stack:** React, react-router-dom, CSS Modules

---

## Task 1: Install react-router-dom

**Files:**
- Modify: `package.json`

**Step 1: Install the dependency**

Run:
```bash
npm install react-router-dom
```

**Step 2: Verify installation**

Run:
```bash
grep react-router-dom package.json
```
Expected: Shows `"react-router-dom": "^7.x.x"` in dependencies

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add react-router-dom dependency"
```

---

## Task 2: Create Header Component

**Files:**
- Create: `src/components/Header.jsx`
- Create: `src/components/Header.module.css`

**Step 1: Create Header.module.css**

```css
.header {
  display: flex;
  align-items: center;
  gap: 32px;
  padding: 16px 24px;
  border-bottom: 1px solid #e0e0e0;
  font-family: sans-serif;
}

.logo {
  font-size: 24px;
  text-decoration: none;
  cursor: pointer;
}

.nav {
  display: flex;
  gap: 24px;
}

.navLink {
  text-decoration: none;
  color: #333;
  font-size: 16px;
  padding: 8px 0;
  border-bottom: 2px solid transparent;
  transition: border-color 0.2s, color 0.2s;
}

.navLink:hover {
  color: #000;
}

.navLinkActive {
  color: #000;
  border-bottom-color: #333;
}
```

**Step 2: Create Header.jsx**

```jsx
import { Link, NavLink } from 'react-router-dom'
import styles from './Header.module.css'

export default function Header() {
  return (
    <header className={styles.header}>
      <Link to="/" className={styles.logo}>⚫⚪</Link>
      <nav className={styles.nav}>
        <NavLink
          to="/daily"
          className={({ isActive }) =>
            [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
          }
        >
          Daily
        </NavLink>
        <NavLink
          to="/library"
          className={({ isActive }) =>
            [styles.navLink, isActive ? styles.navLinkActive : ''].filter(Boolean).join(' ')
          }
        >
          Library
        </NavLink>
      </nav>
    </header>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Header.jsx src/components/Header.module.css
git commit -m "feat: add Header component with navigation"
```

---

## Task 3: Create Footer Component

**Files:**
- Create: `src/components/Footer.jsx`
- Create: `src/components/Footer.module.css`

**Step 1: Create Footer.module.css**

```css
.footer {
  display: flex;
  justify-content: center;
  gap: 24px;
  padding: 24px;
  border-top: 1px solid #e0e0e0;
  margin-top: auto;
}

.link {
  color: #666;
  text-decoration: none;
  font-size: 14px;
  transition: color 0.2s;
}

.link:hover {
  color: #333;
}

.icon {
  width: 24px;
  height: 24px;
}
```

**Step 2: Create Footer.jsx**

```jsx
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <a
        href="https://github.com/csessh"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label="GitHub"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
        </svg>
      </a>
      <a
        href="https://social.linux.pizza/@csessh"
        target="_blank"
        rel="noopener noreferrer"
        className={styles.link}
        aria-label="Mastodon"
      >
        <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.268 5.313c-.35-2.578-2.617-4.61-5.304-5.004C17.51.242 15.792 0 11.813 0h-.03c-3.98 0-4.835.242-5.288.309C3.882.692 1.496 2.518.917 5.127.64 6.412.61 7.837.661 9.143c.074 1.874.088 3.745.26 5.611.118 1.24.325 2.47.62 3.68.55 2.237 2.777 4.098 4.96 4.857 2.336.792 4.849.923 7.256.38.265-.061.527-.132.786-.213.585-.184 1.27-.39 1.774-.753a.057.057 0 00.023-.043v-1.809a.052.052 0 00-.02-.041.053.053 0 00-.046-.01 20.282 20.282 0 01-4.709.545c-2.73 0-3.463-1.284-3.674-1.818a5.593 5.593 0 01-.319-1.433.053.053 0 01.066-.054c1.517.363 3.072.546 4.632.546.376 0 .75 0 1.125-.01 1.57-.044 3.224-.124 4.768-.422.038-.008.077-.015.11-.024 2.435-.464 4.753-1.92 4.989-5.604.008-.145.03-1.52.03-1.67.002-.512.167-3.63-.024-5.545zm-3.748 9.195h-2.561V8.29c0-1.309-.55-1.976-1.67-1.976-1.23 0-1.846.79-1.846 2.35v3.403h-2.546V8.663c0-1.56-.617-2.35-1.848-2.35-1.112 0-1.668.668-1.668 1.977v6.218H4.822V8.102c0-1.31.337-2.35 1.011-3.12.696-.77 1.608-1.164 2.74-1.164 1.311 0 2.302.5 2.962 1.498l.638 1.06.638-1.06c.66-.999 1.65-1.498 2.96-1.498 1.13 0 2.043.395 2.74 1.164.675.77 1.012 1.81 1.012 3.12z" />
        </svg>
      </a>
    </footer>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Footer.jsx src/components/Footer.module.css
git commit -m "feat: add Footer component with social links"
```

---

## Task 4: Create Layout Component

**Files:**
- Create: `src/components/Layout.jsx`
- Create: `src/components/Layout.module.css`

**Step 1: Create Layout.module.css**

```css
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
}
```

**Step 2: Create Layout.jsx**

```jsx
import Header from './Header.jsx'
import Footer from './Footer.jsx'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  return (
    <div className={styles.layout}>
      <Header />
      <main className={styles.main}>{children}</main>
      <Footer />
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/Layout.jsx src/components/Layout.module.css
git commit -m "feat: add Layout component wrapping Header and Footer"
```

---

## Task 5: Create UnderConstruction Component

**Files:**
- Create: `src/components/UnderConstruction.jsx`
- Create: `src/components/UnderConstruction.module.css`

**Step 1: Create UnderConstruction.module.css**

```css
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  flex: 1;
  padding: 40px;
  font-family: sans-serif;
}

.title {
  font-size: 32px;
  margin: 0 0 16px 0;
}

.message {
  font-size: 18px;
  color: #666;
  margin: 0;
}
```

**Step 2: Create UnderConstruction.jsx**

```jsx
import styles from './UnderConstruction.module.css'

export default function UnderConstruction({ title }) {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>🚧 {title} 🚧</h1>
      <p className={styles.message}>This feature is coming soon.</p>
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add src/components/UnderConstruction.jsx src/components/UnderConstruction.module.css
git commit -m "feat: add UnderConstruction placeholder component"
```

---

## Task 6: Create Page Components for Routes

**Files:**
- Create: `src/pages/HomePage.jsx`
- Create: `src/pages/DailyPage.jsx`
- Create: `src/pages/LibraryPage.jsx`

**Step 1: Create src/pages directory**

Run:
```bash
mkdir -p src/pages
```

**Step 2: Create HomePage.jsx**

This wraps the existing game logic from App.jsx.

```jsx
import { useState } from 'react'
import { parseSGFToMoves, getBoardSize, getGameInfo } from '../lib/sgf-parser.js'
import GameController from '../game/GameController'
import UploadPhase from '../components/UploadPhase.jsx'
import StudyPhase from '../components/StudyPhase.jsx'
import ReplayPhase from '../components/ReplayPhase.jsx'
import styles from './HomePage.module.css'

function GameWrapper({ moves, boardSize, gameInfo, onGoHome }) {
  const gameManager = GameController(moves, boardSize)
  const state = gameManager.getState()

  if (state.phase === 'study') {
    return <StudyPhase gameManager={gameManager} gameInfo={gameInfo} />
  }

  if (state.phase === 'replay' || state.phase === 'complete') {
    return <ReplayPhase gameManager={gameManager} gameInfo={gameInfo} onGoHome={onGoHome} />
  }

  return null
}

export default function HomePage() {
  const [moves, setMoves] = useState(null)
  const [boardSize, setBoardSize] = useState(null)
  const [gameInfo, setGameInfo] = useState(null)
  const [error, setError] = useState(null)

  const handleFileLoaded = (sgfContent) => {
    try {
      const size = getBoardSize(sgfContent)
      const parsedMoves = parseSGFToMoves(sgfContent)

      if (parsedMoves.length === 0) {
        setError('No moves found in SGF file')
        return
      }

      setMoves(parsedMoves)
      setBoardSize(size)
      setGameInfo(getGameInfo(sgfContent))
      setError(null)
    } catch (err) {
      setError(`Failed to load game: ${err.message}`)
    }
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <h2>Error</h2>
        <p>{error}</p>
        <button
          onClick={() => setError(null)}
          className={styles.retryButton}
        >
          Try Again
        </button>
      </div>
    )
  }

  const handleGoHome = () => {
    setMoves(null)
    setBoardSize(null)
    setGameInfo(null)
  }

  if (!moves) {
    return <UploadPhase onFileLoaded={handleFileLoaded} />
  }

  return <GameWrapper moves={moves} boardSize={boardSize} gameInfo={gameInfo} onGoHome={handleGoHome} />
}
```

**Step 3: Create HomePage.module.css**

```css
.errorContainer {
  padding: 20px;
  text-align: center;
  font-family: sans-serif;
}

.retryButton {
  margin-top: 20px;
  padding: 10px 30px;
  font-size: 16px;
  background-color: #2196F3;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}
```

**Step 4: Create DailyPage.jsx**

```jsx
import UnderConstruction from '../components/UnderConstruction.jsx'

export default function DailyPage() {
  return <UnderConstruction title="Daily" />
}
```

**Step 5: Create LibraryPage.jsx**

```jsx
import UnderConstruction from '../components/UnderConstruction.jsx'

export default function LibraryPage() {
  return <UnderConstruction title="Library" />
}
```

**Step 6: Commit**

```bash
git add src/pages/
git commit -m "feat: add HomePage, DailyPage, and LibraryPage"
```

---

## Task 7: Update App.jsx with Router

**Files:**
- Modify: `src/App.jsx`
- Delete content from: `src/App.module.css` (styles moved to HomePage)

**Step 1: Update App.jsx**

Replace entire contents with:

```jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import HomePage from './pages/HomePage.jsx'
import DailyPage from './pages/DailyPage.jsx'
import LibraryPage from './pages/LibraryPage.jsx'

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/daily" element={<DailyPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}
```

**Step 2: Clear App.module.css**

Delete all contents (styles now in HomePage.module.css). File can be deleted or left empty.

**Step 3: Verify app runs**

Run:
```bash
npm run dev
```

Open browser to http://localhost:3000 and verify:
- Header appears with logo and nav tabs
- Footer appears with social icons
- Clicking logo goes to home
- Clicking Daily/Library shows "Under Construction"
- Home page shows upload interface

**Step 4: Commit**

```bash
git add src/App.jsx src/App.module.css
git commit -m "feat: integrate router with Layout wrapper"
```

---

## Task 8: Final Verification and Cleanup

**Step 1: Run build to check for errors**

Run:
```bash
npm run build
```
Expected: Build completes with no errors

**Step 2: Run tests**

Run:
```bash
npm test -- --run
```
Expected: All existing tests pass

**Step 3: Manual testing checklist**

- [ ] Logo (⚫⚪) links to home
- [ ] Daily tab shows active state when on /daily
- [ ] Library tab shows active state when on /library
- [ ] Footer icons link to correct URLs in new tab
- [ ] Full game flow still works (upload → study → replay)

**Step 4: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address any issues from testing"
```
