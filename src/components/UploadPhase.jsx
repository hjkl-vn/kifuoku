import React, { useState } from 'react'
import { isValidOgsUrl, extractGameId, fetchOgsSgf } from '../lib/ogs.js'

export default function UploadPhase({ onFileLoaded }) {
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [urlValue, setUrlValue] = useState('')

  const handleFile = async (file) => {
    setError(null)

    if (!file.name.endsWith('.sgf')) {
      setError('Please upload a .sgf file')
      return
    }

    try {
      const text = await file.text()
      onFileLoaded(text)
    } catch (err) {
      setError(`Failed to read file: ${err.message}`)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)

    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleFileInput = (e) => {
    const file = e.target.files[0]
    if (file) handleFile(file)
  }

  const handleUrlPaste = async (e) => {
    const text = e.clipboardData.getData('text')
    if (!text) return

    setError(null)

    if (!isValidOgsUrl(text)) {
      setError('Please enter a valid online-go.com game URL')
      return
    }

    const gameId = extractGameId(text)
    setIsLoading(true)

    try {
      const sgf = await fetchOgsSgf(gameId)
      setUrlValue('')
      onFileLoaded(sgf, `https://online-go.com/game/${gameId}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const dropZoneClass = [
    'border-3 border-dashed border-gray-300 rounded-xl py-15 px-5 text-center bg-gray-50 transition-all duration-200',
    dragOver ? 'border-success bg-green-50' : '',
    isLoading ? 'opacity-50 pointer-events-none' : ''
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <div className="max-w-[600px] mx-auto mt-12 p-5">
      <h1 className="text-center text-3xl mb-8">Kifu-oku (棋譜憶)</h1>
      <div
        className={dropZoneClass}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={isLoading ? undefined : handleDrop}
      >
        <p className="text-lg text-gray-500 m-0 mb-2.5">Drop SGF file here</p>
        <p className="text-sm text-gray-400 my-2.5">or</p>
        <label className="inline-block py-3 px-8 bg-success text-white rounded cursor-pointer text-base font-bold transition-colors duration-200 hover:bg-green-600">
          Choose File
          <input
            type="file"
            accept=".sgf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading}
          />
        </label>
      </div>

      <p className="text-center text-gray-400 my-5 text-sm">─── or ───</p>

      <input
        type="text"
        className="w-full p-4 text-base border-2 border-gray-300 rounded focus:outline-none focus:border-success disabled:bg-gray-100 disabled:cursor-not-allowed"
        placeholder="Paste online-go.com link here"
        value={urlValue}
        onChange={(e) => setUrlValue(e.target.value)}
        onPaste={handleUrlPaste}
        disabled={isLoading}
      />

      {isLoading && (
        <p className="text-center text-gray-500 mt-2.5 text-sm">Loading game from OGS...</p>
      )}

      {error && <p className="text-error text-center mt-5 text-sm">{error}</p>}

      <div className="mt-10 p-5 bg-blue-50 rounded text-sm leading-relaxed">
        <p>
          <strong>How to play:</strong>
        </p>
        <ol>
          <li>Upload a Go game (SGF format)</li>
          <li>Study the game using prev/next buttons (or arrow keys)</li>
          <li>Replay the game from memory</li>
          <li>You'll get hints when you make mistakes</li>
        </ol>
      </div>
    </div>
  )
}
