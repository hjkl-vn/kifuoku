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

  const positionClasses = isTop ? 'top-0 border-b' : 'bottom-0 border-t'

  const transformClasses = isTop
    ? isExpanded
      ? 'translate-y-0'
      : '-translate-y-[calc(100%-50px)]'
    : isExpanded
      ? 'translate-y-0'
      : 'translate-y-[calc(100%-50px)]'

  return (
    <div
      className={[
        'fixed left-0 right-0 bg-white border-gray-300 z-20 transition-transform duration-300',
        positionClasses,
        transformClasses
      ].join(' ')}
    >
      <button
        className="flex items-center justify-center gap-2 w-full h-[50px] bg-gray-100 border-none cursor-pointer text-sm font-medium hover:bg-gray-200"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <span className="text-xs">{isExpanded ? expandedArrow : collapsedArrow}</span>
        <span>{isExpanded ? expandedTitle || title : title}</span>
      </button>
      <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
    </div>
  )
}
