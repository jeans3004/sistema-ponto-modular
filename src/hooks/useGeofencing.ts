'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { calculateDistance } from '@/lib/geolocation'
import { SYSTEM_CONFIG } from '@/lib/config'

const GEOFENCE_NOTIFIED_KEY = 'geofence_last_notified_date'

function getTodayDateString(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: SYSTEM_CONFIG.TIMEZONE })
}

function wasNotifiedToday(): boolean {
  if (typeof window === 'undefined') return false
  const lastDate = localStorage.getItem(GEOFENCE_NOTIFIED_KEY)
  return lastDate === getTodayDateString()
}

function markNotifiedToday(): void {
  localStorage.setItem(GEOFENCE_NOTIFIED_KEY, getTodayDateString())
}

async function requestNotificationPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false
  if (Notification.permission === 'granted') return true
  if (Notification.permission === 'denied') return false
  const result = await Notification.requestPermission()
  return result === 'granted'
}

function sendBrowserNotification() {
  if (!('Notification' in window) || Notification.permission !== 'granted') return

  new Notification('Ponto Digital', {
    body: 'Voc\u00ea est\u00e1 na \u00e1rea de trabalho! Lembre-se de bater o ponto.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'geofence-arrival',
  })
}

interface UseGeofencingReturn {
  isMonitoring: boolean
  isInsideGeofence: boolean
  lastNotifiedAt: string | null
  startMonitoring: () => void
  stopMonitoring: () => void
}

export function useGeofencing(): UseGeofencingReturn {
  const [isMonitoring, setIsMonitoring] = useState(false)
  const [isInsideGeofence, setIsInsideGeofence] = useState(false)
  const [lastNotifiedAt, setLastNotifiedAt] = useState<string | null>(null)
  const watchIdRef = useRef<number | null>(null)
  const wasInsideRef = useRef(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLastNotifiedAt(localStorage.getItem(GEOFENCE_NOTIFIED_KEY))
    }
  }, [])

  const handlePositionUpdate = useCallback((position: GeolocationPosition) => {
    const { latitude, longitude } = position.coords
    const distance = calculateDistance(
      latitude,
      longitude,
      SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
      SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
    )

    const isInside = distance <= SYSTEM_CONFIG.GEOLOCATION.ALLOWED_RADIUS_METERS
    setIsInsideGeofence(isInside)

    // Detectar transicao fora -> dentro
    if (isInside && !wasInsideRef.current) {
      if (!wasNotifiedToday()) {
        requestNotificationPermission().then((granted) => {
          if (granted) {
            sendBrowserNotification()
          }
        })
        markNotifiedToday()
        setLastNotifiedAt(getTodayDateString())
      }
    }

    wasInsideRef.current = isInside
  }, [])

  const startMonitoring = useCallback(() => {
    if (typeof window === 'undefined') return
    if (!('geolocation' in navigator)) return
    if (!SYSTEM_CONFIG.GEOLOCATION.ENABLED) return
    if (watchIdRef.current !== null) return

    requestNotificationPermission()

    const id = navigator.geolocation.watchPosition(
      handlePositionUpdate,
      (error) => {
        console.warn('[Geofencing] Watch error:', error.message)
      },
      {
        enableHighAccuracy: SYSTEM_CONFIG.GEOLOCATION.HIGH_ACCURACY,
        timeout: SYSTEM_CONFIG.GEOLOCATION.TIMEOUT_MS,
        maximumAge: SYSTEM_CONFIG.GEOLOCATION.MAX_AGE_MS,
      }
    )

    watchIdRef.current = id
    setIsMonitoring(true)
  }, [handlePositionUpdate])

  const stopMonitoring = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
    }
    setIsMonitoring(false)
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  return {
    isMonitoring,
    isInsideGeofence,
    lastNotifiedAt,
    startMonitoring,
    stopMonitoring,
  }
}
