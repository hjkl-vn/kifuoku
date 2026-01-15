import { useEffect, useState, useRef, useCallback } from 'react'

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000

export function useServiceWorker() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const updateSWRef = useRef(null)

  useEffect(() => {
    if (!('serviceWorker' in window.navigator)) return

    const register = async () => {
      const { registerSW } = await import('virtual:pwa-register')

      updateSWRef.current = registerSW({
        immediate: true,
        onNeedRefresh() {
          setNeedRefresh(true)
        },
        onRegisteredSW(swUrl, registration) {
          if (registration) {
            window.setInterval(() => {
              registration.update()
            }, UPDATE_CHECK_INTERVAL_MS)
          }
        }
      })
    }

    register()
  }, [])

  const applyUpdate = useCallback(() => {
    if (updateSWRef.current) {
      updateSWRef.current(true).then(() => {
        window.location.reload()
      })
    }
  }, [])

  return { needRefresh, applyUpdate }
}
