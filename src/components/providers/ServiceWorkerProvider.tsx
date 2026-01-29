'use client'

import { useEffect } from 'react'

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported')
      return
    }

    // Registrar Service Worker
    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/'
        })

        console.log('[SW] Service Worker registered:', registration.scope)

        // Verificar atualizações periodicamente
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (!newWorker) return

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // Nova versão disponível
              console.log('[SW] New version available')
            }
          })
        })

        // Verificar atualizações a cada hora
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)

      } catch (error) {
        console.error('[SW] Registration failed:', error)
      }
    }

    // Aguardar a página carregar completamente
    if (document.readyState === 'complete') {
      registerSW()
    } else {
      window.addEventListener('load', registerSW)
      return () => window.removeEventListener('load', registerSW)
    }
  }, [])

  return <>{children}</>
}
