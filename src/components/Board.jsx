import React from 'react'
import { Goban } from '@sabaki/shudan'

export default function Board({ signMap, markerMap, paintMap, onVertexClick }) {
  return (
    <Goban
      animateStonePlacement={true}
      busy={false}
      fuzzyStonePlacement={true}
      showCoordinates={true}
      signMap={signMap}
      markerMap={markerMap}
      paintMap={paintMap}
      vertexSize={34}
      onVertexClick={onVertexClick}
    />
  )
}
