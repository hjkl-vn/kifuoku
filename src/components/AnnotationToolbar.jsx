import React from 'react'
import { ANNOTATION_TOOLS } from '../game/constants'
import styles from '../styles/AnnotationToolbar.module.css'

export default function AnnotationToolbar({ selectedTool, onSelectTool }) {
  return (
    <div className={styles.toolbar}>
      <span className={styles.title}>Annotate</span>
      <div className={styles.tools}>
        {ANNOTATION_TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={[styles.toolButton, selectedTool === tool.id ? styles.selected : '']
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
