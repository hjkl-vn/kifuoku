import React, { useState } from 'react'

export default function BottomSheet({
  isExpanded: controlledExpanded,
  onToggle,
  title = 'Show Details',
  expandedTitle = 'Hide Details',
  children
}) {
  const [internalExpanded, setInternalExpanded] = useState(false)
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded

  const handleToggle = () => {
    if (onToggle) {
      onToggle(!isExpanded)
    } else {
      setInternalExpanded(!internalExpanded)
    }
  }

  return (
    <div
      className={[
        'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-300 z-10 transition-transform duration-300',
        isExpanded ? 'translate-y-0' : 'translate-y-[calc(100%-50px)]'
      ].join(' ')}
    >
      <button
        className="flex items-center justify-center gap-2 w-full h-[50px] bg-gray-100 border-none border-b border-gray-300 cursor-pointer text-sm font-medium hover:bg-gray-200"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <span className="text-xs">{isExpanded ? '▼' : '▲'}</span>
        <span>{isExpanded ? expandedTitle : title}</span>
      </button>
      <div className="p-4 max-h-[60vh] overflow-y-auto">{children}</div>
    </div>
  )
}
