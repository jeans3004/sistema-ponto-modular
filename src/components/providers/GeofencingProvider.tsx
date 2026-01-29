'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useGeofencing } from '@/hooks/useGeofencing'
import { useUsuario } from '@/hooks/useUsuario'
import { GeofenceAlert } from '@/components/ui/GeofenceAlert'
import { SYSTEM_CONFIG } from '@/lib/config'

export function GeofencingProvider({ children }: { children: React.ReactNode }) {
  const { status } = useSession()
  const { usuario, isLoading } = useUsuario()
  const { isInsideGeofence, isMonitoring, startMonitoring } = useGeofencing()
  const [dismissed, setDismissed] = useState(false)

  const isColaborador = usuario?.nivelAtivo === 'colaborador'
  const isAuthenticated = status === 'authenticated'
  const shouldMonitor =
    SYSTEM_CONFIG.GEOLOCATION.ENABLED &&
    isAuthenticated &&
    !isLoading &&
    isColaborador

  useEffect(() => {
    if (shouldMonitor && !isMonitoring) {
      startMonitoring()
    }
  }, [shouldMonitor, isMonitoring, startMonitoring])

  const showAlert = isInsideGeofence && shouldMonitor && !dismissed

  return (
    <>
      {showAlert && <GeofenceAlert onDismiss={() => setDismissed(true)} />}
      {children}
    </>
  )
}
