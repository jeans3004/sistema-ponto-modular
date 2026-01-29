import { SYSTEM_CONFIG } from './config'

export interface Coordinates {
  latitude: number
  longitude: number
  accuracy?: number
  timestamp?: number
}

export interface GeolocationResult {
  success: boolean
  coordinates?: Coordinates
  error?: string
  distanceFromWorkplace?: number
  isWithinAllowedRadius?: boolean
}

/**
 * Calcula a distância entre duas coordenadas usando a fórmula de Haversine
 * @param lat1 Latitude do ponto 1
 * @param lon1 Longitude do ponto 1
 * @param lat2 Latitude do ponto 2
 * @param lon2 Longitude do ponto 2
 * @returns Distância em metros
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000 // Raio da Terra em metros
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

/**
 * Verifica se as coordenadas estão dentro do raio permitido do local de trabalho
 * @param userCoordinates Coordenadas do usuário
 * @returns true se estiver dentro do raio permitido
 */
export function isWithinWorkplaceRadius(userCoordinates: Coordinates): boolean {
  if (!SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
    return true // Se geolocalização estiver desabilitada, sempre permitir
  }

  const distance = calculateDistance(
    userCoordinates.latitude,
    userCoordinates.longitude,
    SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
    SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
  )

  return distance <= SYSTEM_CONFIG.GEOLOCATION.ALLOWED_RADIUS_METERS
}

/**
 * Obtém a localização atual do usuário
 * @returns Promise com o resultado da geolocalização
 */
export function getCurrentLocation(): Promise<GeolocationResult> {
  return new Promise((resolve) => {
    // Se geolocalização estiver desabilitada, retornar sucesso
    if (!SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
      resolve({
        success: true,
        isWithinAllowedRadius: true,
        error: 'Geolocalização desabilitada'
      })
      return
    }

    // Verificar se o navegador suporta geolocalização
    if (!navigator.geolocation) {
      resolve({
        success: false,
        error: 'Geolocalização não suportada pelo navegador'
      })
      return
    }

    const options: PositionOptions = {
      enableHighAccuracy: SYSTEM_CONFIG.GEOLOCATION.HIGH_ACCURACY,
      timeout: SYSTEM_CONFIG.GEOLOCATION.TIMEOUT_MS,
      maximumAge: SYSTEM_CONFIG.GEOLOCATION.MAX_AGE_MS
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coordinates: Coordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }

        const distanceFromWorkplace = calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
        )

        const isWithinRadius = isWithinWorkplaceRadius(coordinates)

        resolve({
          success: true,
          coordinates,
          distanceFromWorkplace,
          isWithinAllowedRadius: isWithinRadius
        })
      },
      (error) => {
        let errorMessage = 'Erro desconhecido'
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Permissão de localização negada pelo usuário'
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informação de localização não disponível'
            break
          case error.TIMEOUT:
            errorMessage = 'Timeout na solicitação de localização'
            break
        }

        resolve({
          success: false,
          error: errorMessage
        })
      },
      options
    )
  })
}

/**
 * Formata a distância para exibição
 * @param distanceInMeters Distância em metros
 * @returns String formatada
 */
export function formatDistance(distanceInMeters: number): string {
  if (distanceInMeters < 1000) {
    return `${Math.round(distanceInMeters)}m`
  } else {
    return `${(distanceInMeters / 1000).toFixed(1)}km`
  }
}

/**
 * Obtém o status da geolocalização para exibição
 * @param result Resultado da geolocalização
 * @returns Objeto com status, cor e ícone
 */
export function getLocationStatus(result: GeolocationResult) {
  if (!SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
    return {
      status: 'Desabilitada',
      color: 'gray',
      icon: 'disabled',
      message: 'Validação de localização desabilitada'
    }
  }

  if (!result.success) {
    return {
      status: 'Erro',
      color: 'red',
      icon: 'error',
      message: result.error || 'Erro ao obter localização'
    }
  }

  if (result.isWithinAllowedRadius) {
    return {
      status: 'Válida',
      color: 'green',
      icon: 'valid',
      message: `Localização válida (${formatDistance(result.distanceFromWorkplace || 0)} do trabalho)`
    }
  } else {
    return {
      status: 'Fora da área',
      color: 'red',
      icon: 'invalid',
      message: `Muito longe do trabalho (${formatDistance(result.distanceFromWorkplace || 0)})`
    }
  }
}