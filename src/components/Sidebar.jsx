import React from 'react'
import PropTypes from 'prop-types'
import GameInfo from './GameInfo'

export default function Sidebar({ gameInfo, currentTurn }) {
  return (
    <aside className="flex flex-col gap-5 flex-1 min-w-[200px] max-w-[280px]">
      <GameInfo gameInfo={gameInfo} currentTurn={currentTurn} />
    </aside>
  )
}

Sidebar.propTypes = {
  gameInfo: PropTypes.object,
  currentTurn: PropTypes.oneOf(['B', 'W'])
}
