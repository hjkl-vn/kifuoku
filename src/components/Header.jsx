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
