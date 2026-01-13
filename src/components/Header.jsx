import { NavLink, useNavigate } from 'react-router-dom'

export default function Header() {
  const navigate = useNavigate()

  const handleLogoClick = () => {
    navigate('/')
    window.dispatchEvent(new window.CustomEvent('reset-game'))
  }

  const navLinkClass = ({ isActive }) =>
    [
      'no-underline text-gray-700 text-base py-2 border-b-2 border-transparent transition-colors duration-200 hover:text-black',
      isActive ? 'text-black border-gray-700' : ''
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <header className="flex items-center gap-8 px-6 h-11 border-b border-gray-200 bg-white fixed top-0 left-0 right-0 z-30">
      <button
        onClick={handleLogoClick}
        className="text-2xl cursor-pointer bg-transparent border-none p-0"
      >
        ⚫⚪
      </button>
      <nav className="flex gap-6">
        <NavLink to="/daily" className={navLinkClass}>
          Daily
        </NavLink>
        <NavLink to="/library" className={navLinkClass}>
          Library
        </NavLink>
      </nav>
    </header>
  )
}
