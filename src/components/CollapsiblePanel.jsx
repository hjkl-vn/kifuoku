import React, { useState } from 'react'

export default function CollapsiblePanel({
  position = 'bottom',
  isExpanded: controlledExpanded,
  onToggle,
  defaultExpanded = false,
  title = 'Show Details',
  expandedTitle,
  children
}) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    const newValue = !isExpanded
    if (onToggle) {
      onToggle(newValue)
    } else {
      setInternalExpanded(newValue)
    }
  }

  const isTop = position === 'top'

  const collapsedArrow = isTop ? '▼' : '▲'
  const expandedArrow = isTop ? '▲' : '▼'

  // top-11 matches Header's h-11 height
  const positionClasses = isTop ? 'top-11' : 'bottom-0 border-t border-gray-300'

  const transformClasses = isTop
    ? isExpanded
      ? 'translate-y-0'
      : '-translate-y-[calc(100%-50px)]'
    : isExpanded
      ? 'translate-y-0'
      : 'translate-y-[calc(100%-50px)]'

  const headerButton = (
    <button
      className={[
        'flex items-center justify-center gap-2 w-full h-[50px] bg-gray-100 border-none cursor-pointer text-sm font-medium hover:bg-gray-200',
        isTop ? 'border-t border-gray-300' : 'border-b border-gray-300'
      ].join(' ')}
      onClick={handleToggle}
      aria-expanded={isExpanded}
    >
      <span className="text-xs">{isExpanded ? expandedArrow : collapsedArrow}</span>
      <span>{isExpanded ? expandedTitle || title : title}</span>
    </button>
  )

  const content = <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>

  return (
    <div
      className={[
        'fixed left-0 right-0 bg-white z-20 transition-transform duration-300',
        positionClasses,
        transformClasses
      ].join(' ')}
    >
      {isTop ? (
        <>
          {content}
          {headerButton}
        </>
      ) : (
        <>
          {headerButton}
          {content}
        </>
      )}
    </div>
  )
}
