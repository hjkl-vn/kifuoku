import React from 'react'
import PropTypes from 'prop-types'
import { Goban } from '@sabaki/shudan'

export default function Board({
  signMap,
  markerMap,
  paintMap,
  ghostStoneMap,
  onVertexClick,
  onVertexMouseEnter,
  onVertexMouseLeave,
  vertexSize = 34,
  oneColorMode = false
}) {
  return (
    <div
      className={[ghostStoneMap ? 'has-pending-move' : '', oneColorMode ? 'one-color-mode' : '']
        .filter(Boolean)
        .join(' ')}
    >
      <Goban
        animateStonePlacement={true}
        busy={false}
        fuzzyStonePlacement={true}
        showCoordinates={true}
        signMap={signMap}
        markerMap={markerMap}
        paintMap={paintMap}
        ghostStoneMap={ghostStoneMap}
        vertexSize={vertexSize}
        onVertexClick={onVertexClick}
        onVertexMouseEnter={onVertexMouseEnter}
        onVertexMouseLeave={onVertexMouseLeave}
      />
    </div>
  )
}

Board.propTypes = {
  signMap: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.number)),
  markerMap: PropTypes.arrayOf(PropTypes.array),
  paintMap: PropTypes.arrayOf(PropTypes.array),
  ghostStoneMap: PropTypes.arrayOf(PropTypes.array),
  onVertexClick: PropTypes.func,
  onVertexMouseEnter: PropTypes.func,
  onVertexMouseLeave: PropTypes.func,
  vertexSize: PropTypes.number,
  oneColorMode: PropTypes.bool
}
