import { useState, useEffect, useRef } from 'react'

// Space reserved for Shudan coordinate labels (A-T, 1-19) on each edge (~24px per side)
const COORDINATE_LABEL_SPACE = 48

export function useBoardSize({ boardSize, maxVertexSize = 38 }) {
  const containerRef = useRef(null)
  const [vertexSize, setVertexSize] = useState(maxVertexSize)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const calculateSize = () => {
      const availableWidth = container.clientWidth - COORDINATE_LABEL_SPACE
      const availableHeight = container.clientHeight - COORDINATE_LABEL_SPACE

      const fromWidth = Math.floor(availableWidth / boardSize)
      const fromHeight = Math.floor(availableHeight / boardSize)

      const calculated = Math.min(fromWidth, fromHeight)
      setVertexSize(Math.min(maxVertexSize, calculated))
    }

    const observer = new ResizeObserver(calculateSize)
    observer.observe(container)

    const timeoutId = setTimeout(calculateSize, 0)

    return () => {
      observer.disconnect()
      clearTimeout(timeoutId)
    }
  }, [boardSize, maxVertexSize])

  return { containerRef, vertexSize }
}
