import React from 'react'
import GameInfo from './GameInfo'
import styles from '../styles/Sidebar.module.css'

export default function Sidebar({ gameInfo, currentTurn, children }) {
  return (
    <aside className={styles.sidebar}>
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
      {children}
    </aside>
  )
}
