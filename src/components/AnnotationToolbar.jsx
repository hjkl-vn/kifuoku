import React from 'react'
import { ANNOTATION_TOOLS } from '../game/constants'

export default function AnnotationToolbar({ selectedTool, onSelectTool }) {
  return (
    <div className="flex flex-col gap-2 p-3 bg-gray-100 rounded-lg">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Annotate</span>
      <div className="flex gap-2">
        {ANNOTATION_TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={[
              'w-10 h-10 flex items-center justify-center text-xl bg-white border-2 border-gray-300 rounded-lg cursor-pointer transition-all duration-150',
              selectedTool === tool.id
                ? 'border-primary bg-primary text-white'
                : 'hover:border-primary hover:bg-blue-50'
            ]
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
            title={tool.title}
            aria-pressed={selectedTool === tool.id}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  )
}
