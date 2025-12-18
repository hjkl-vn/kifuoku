import React from 'react'
import { Goban } from '@sabaki/shudan'

export default function Board({ signMap, markerMap, paintMap, onVertexClick, vertexSize = 34 }) {
  return (
    <Goban
      animateStonePlacement={true}
      busy={false}
      fuzzyStonePlacement={true}
      showCoordinates={true}
      signMap={signMap}
      markerMap={markerMap}
      paintMap={paintMap}
      vertexSize={vertexSize}
      onVertexClick={onVertexClick}
    />
  )
}
