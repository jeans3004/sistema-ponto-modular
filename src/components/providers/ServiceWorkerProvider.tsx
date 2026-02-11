'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface SWContextValue {
  updateAvailable: boolean
  applyUpdate: () => void
}

const SWContext = createContext<SWContextValue>({
  updateAvailable: false,
  applyUpdate: () => {},
})

export function useServiceWorker() {
  return useContext(SWContext)
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  const applyUpdate = () => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
    }
    window.location.reload()
  }

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported')
      return
    }

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('[SW] Service Worker registered:', registration.scope)

        // Se já existe um worker waiting (atualização pendente)
        if (registration.waiting) {
          setWaitingWorker(registration.waiting)
          setUpdateAvailable(true)
        }

        // Detectar nova atualização sendo instalada
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('[SW] New version available')
              setWaitingWorker(newWorker)
              setUpdateAvailable(true)
            }
          })
        })

        // Quando o novo SW toma controle, recarregar a página
        let refreshing = false
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })

        // Verificar atualizações imediatamente e a cada 30 minutos
        registration.update()
        setInterval(() => {
          registration.update()
        }, 30 * 60 * 1000)

      } catch (error) {
        console.error('[SW] Registration failed:', error)
      }
    }

    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return (
    <SWContext.Provider value={{ updateAvailable, applyUpdate }}>
      {children}
    </SWContext.Provider>
  )
}
