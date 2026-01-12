import React from 'react'
import PropTypes from 'prop-types'
import GameInfo from './GameInfo'

export default function Sidebar({ gameInfo, currentTurn, children }) {
  return (
    <aside className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[320px]">
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
      {children}
    </aside>
  )
}

Sidebar.propTypes = {
  gameInfo: PropTypes.object,
  currentTurn: PropTypes.oneOf(['B', 'W']),
  children: PropTypes.node
}
