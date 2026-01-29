import { useState, useEffect, useCallback } from 'react'
import { getCurrentLocation, GeolocationResult, getLocationStatus } from '@/lib/geolocation'

export interface UseGeolocationReturn {
  location: GeolocationResult | null
  isLoading: boolean
  error: string | null
  refresh: () => void
  status: {
    status: string
    color: string
    icon: string
    message: string
  }
}

export function useGeolocation(autoRefresh = false): UseGeolocationReturn {
  const [location, setLocation] = useState<GeolocationResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const result = await getCurrentLocation()
      console.log('Resultado da geolocalização:', result)
      setLocation(result)
      
      if (!result.success) {
        setError(result.error || 'Erro ao obter localização')
      } else if (result.coordinates) {
        console.log('Coordenadas obtidas:', {
          latitude: result.coordinates.latitude,
          longitude: result.coordinates.longitude,
          accuracy: result.coordinates.accuracy
        })
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido'
      console.error('Erro no hook de geolocalização:', err)
      setError(errorMessage)
      setLocation({
        success: false,
        error: errorMessage
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Auto-refresh na montagem do componente
  useEffect(() => {
    if (autoRefresh) {
      refresh()
    }
  }, [refresh, autoRefresh])

  // Calcular status da localização
  const status = location ? getLocationStatus(location) : {
    status: 'Não verificada',
    color: 'gray',
    icon: 'unknown',
    message: 'Localização não verificada'
  }

  return {
    location,
    isLoading,
    error,
    refresh,
    status
  }
}