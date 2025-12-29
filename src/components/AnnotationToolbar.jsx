import React from 'react'
import styles from '../styles/AnnotationToolbar.module.css'

const TOOLS = [
  { id: 'circle', label: '○', title: 'Circle' },
  { id: 'triangle', label: '△', title: 'Triangle' },
  { id: 'cross', label: '✕', title: 'Cross' },
  { id: 'label', label: 'A', title: 'Label' }
]

export default function AnnotationToolbar({ selectedTool, onSelectTool }) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>Annotate</span>
      <div className={styles.tools}>
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={[styles.toolButton, selectedTool === tool.id ? styles.selected : '']
              .filter(Boolean)
              .join(' ')}
            onClick={() => onSelectTool(selectedTool === tool.id ? null : tool.id)}
            title={tool.title}
          >
            {tool.label}
          </button>
        ))}
      </div>
    </div>
  )
}
