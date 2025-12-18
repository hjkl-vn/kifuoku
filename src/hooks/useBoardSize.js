import { useState, useEffect, useRef } from 'react'

const COORDINATE_LABEL_SPACE = 48
const SIDEBAR_WIDTH = 280
const LAYOUT_GAP = 40
const CONTAINER_PADDING = 40

export function useBoardSize({
  boardSize,
  maxVertexSize = 38
}) {
  const containerRef = useRef(null)
  const [vertexSize, setVertexSize] = useState(maxVertexSize)
  const [isMobileLayout, setIsMobileLayout] = useState(false)

  useEffect(() => {
    const checkMobileLayout = () => {
      const boardWidth = (boardSize * maxVertexSize) + COORDINATE_LABEL_SPACE
      const minDesktopWidth = SIDEBAR_WIDTH + LAYOUT_GAP + boardWidth + CONTAINER_PADDING
      setIsMobileLayout(window.innerWidth < minDesktopWidth)
    }

    checkMobileLayout()
    window.addEventListener('resize', checkMobileLayout)
    return () => window.removeEventListener('resize', checkMobileLayout)
  }, [boardSize, maxVertexSize])

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
  }, [boardSize, maxVertexSize, isMobileLayout])

  return { containerRef, vertexSize, isMobileLayout }
}
