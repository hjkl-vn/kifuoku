import React from 'react'

export default function ProgressBar({ current, total }) {
  const percentage = total > 0 ? (current / total) * 100 : 0

  return (
    <div style={styles.container}>
      <div style={styles.barBackground}>
        <div style={{...styles.barFill, width: `${percentage}%`}} />
      </div>
      <div style={styles.text}>
        {current} / {total}
      </div>
    </div>
  )
}

const styles = {
  container: {
    marginBottom: '20px'
  },
  barBackground: {
    width: '100%',
    height: '24px',
    backgroundColor: '#e0e0e0',
    borderRadius: '12px',
    overflow: 'hidden',
    marginBottom: '8px'
  },
  barFill: {
    height: '100%',
    backgroundColor: '#2196F3',
    transition: 'width 0.3s ease'
  },
  text: {
    textAlign: 'center',
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#666'
  }
}
