import React from 'react'
import { Goban } from '@sabaki/shudan'
import styles from '../styles/Board.module.css'

export default function Board({
  signMap,
  markerMap,
  paintMap,
  ghostStoneMap,
  onVertexClick,
  onVertexMouseEnter,
  onVertexMouseLeave,
  vertexSize = 34
}) {
  return (
    <div className={ghostStoneMap ? styles.hasPendingMove : ''}>
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
