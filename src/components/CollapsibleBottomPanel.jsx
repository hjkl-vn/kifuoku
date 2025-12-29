import React, { useState, useEffect } from 'react'
import styles from '../styles/CollapsibleBottomPanel.module.css'

export default function CollapsibleBottomPanel({
  isExpanded: controlledExpanded,
  onToggle,
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
      className={[styles.container, isExpanded ? styles.expanded : ''].filter(Boolean).join(' ')}
    >
      <button className={styles.handle} onClick={handleToggle} aria-expanded={isExpanded}>
        <span className={styles.arrow}>{isExpanded ? '▼' : '▲'}</span>
        <span>{isExpanded ? 'Hide' : 'Show Stats'}</span>
      </button>
      <div className={styles.content}>{children}</div>
    </div>
  )
}
