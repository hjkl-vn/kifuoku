import { useServiceWorker } from '../hooks/useServiceWorker.js'

export default function UpdateBanner() {
  const { needRefresh, applyUpdate } = useServiceWorker()

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-stone-800 text-white px-4 py-3 rounded-lg shadow-lg flex items-center justify-between gap-3 z-50">
      <span className="text-sm">New version available</span>
      <button
        onClick={applyUpdate}
        className="bg-white text-stone-800 px-3 py-1 rounded text-sm font-medium hover:bg-gray-100 transition-colors"
      >
        Refresh
      </button>
    </div>
  )
}
