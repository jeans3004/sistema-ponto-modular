'use client'

import { useState, useEffect, useCallback } from 'react'
import type { BeforeInstallPromptEvent, PWAState } from '@/types/pwa'

const DISMISS_STORAGE_KEY = 'pwa-install-dismissed'
const DISMISS_DURATION_DAYS = 7

export function usePWA() {
  const [state, setState] = useState<PWAState>({
    isInstallable: false,
    isInstalled: false,
    isIOS: false,
    isAndroid: false,
    isStandalone: false,
    deferredPrompt: null
  })

  const [showBanner, setShowBanner] = useState(false)

  // Detectar plataforma e modo
  useEffect(() => {
    if (typeof window === 'undefined') return

    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) &&
                  !(window as unknown as { MSStream?: unknown }).MSStream
    const isAndroid = /Android/.test(navigator.userAgent)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches ||
                         (navigator as unknown as { standalone?: boolean }).standalone === true

    setState(prev => ({
      ...prev,
      isIOS,
      isAndroid,
      isStandalone,
      isInstalled: isStandalone
    }))

    // Para iOS, mostrar banner customizado se não estiver instalado
    if (isIOS && !isStandalone && !isDismissed()) {
      setTimeout(() => setShowBanner(true), 3000)
    }
  }, [])

  // Capturar evento de instalação (Android/Desktop)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault()
      setState(prev => ({
        ...prev,
        isInstallable: true,
        deferredPrompt: e
      }))

      if (!isDismissed()) {
        setTimeout(() => setShowBanner(true), 2000)
      }
    }

    const handleAppInstalled = () => {
      setState(prev => ({
        ...prev,
        isInstalled: true,
        isInstallable: false,
        deferredPrompt: null
      }))
      setShowBanner(false)
      console.log('[PWA] App installed successfully')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Verificar se foi dispensado recentemente
  const isDismissed = (): boolean => {
    if (typeof window === 'undefined') return true
    const dismissed = localStorage.getItem(DISMISS_STORAGE_KEY)
    if (!dismissed) return false

    const dismissedDate = new Date(dismissed)
    const now = new Date()
    const diffDays = (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24)

    return diffDays < DISMISS_DURATION_DAYS
  }

  // Instalar PWA (Android/Desktop)
  const install = useCallback(async () => {
    if (!state.deferredPrompt) return false

    try {
      await state.deferredPrompt.prompt()
      const { outcome } = await state.deferredPrompt.userChoice

      if (outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt')
        return true
      } else {
        console.log('[PWA] User dismissed install prompt')
        return false
      }
    } catch (error) {
      console.error('[PWA] Install error:', error)
      return false
    } finally {
      setState(prev => ({ ...prev, deferredPrompt: null, isInstallable: false }))
      setShowBanner(false)
    }
  }, [state.deferredPrompt])

  // Dispensar banner
  const dismissBanner = useCallback(() => {
    localStorage.setItem(DISMISS_STORAGE_KEY, new Date().toISOString())
    setShowBanner(false)
  }, [])

  return {
    ...state,
    showBanner,
    install,
    dismissBanner
  }
}
