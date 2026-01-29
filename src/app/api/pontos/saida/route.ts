import { NextRequest, NextResponse } from 'next/server'
import { registrarSaida } from '@/lib/firebaseDb'
import { calculateDistance } from '@/lib/geolocation'
import { SYSTEM_CONFIG } from '@/lib/config'
import { verificarAutenticacao, criarRespostaErro } from '@/lib/authMiddleware'

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const usuario = authResult.usuario!

    // Obter dados da requisição
    const body = await req.json().catch(() => ({}))
    const locationData: LocationData | undefined = body.location

    // Validar geolocalização se estiver habilitada
    if (SYSTEM_CONFIG.GEOLOCATION.ENABLED) {
      if (!locationData) {
        return NextResponse.json({ 
          error: 'Localização é obrigatória para registrar ponto',
          code: 'LOCATION_REQUIRED'
        }, { status: 400 })
      }

      // Validar se as coordenadas estão válidas
      if (typeof locationData.latitude !== 'number' || typeof locationData.longitude !== 'number' || 
          isNaN(locationData.latitude) || isNaN(locationData.longitude) ||
          locationData.latitude === 0 || locationData.longitude === 0) {
        return NextResponse.json({ 
          error: `Coordenadas de localização inválidas: lat=${locationData.latitude}, lng=${locationData.longitude}`,
          code: 'INVALID_COORDINATES'
        }, { status: 400 })
      }

      // Calcular distância do local de trabalho
      const distance = calculateDistance(
        locationData.latitude,
        locationData.longitude,
        SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
        SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
      )

      // Verificar se está dentro do raio permitido
      if (distance > SYSTEM_CONFIG.GEOLOCATION.ALLOWED_RADIUS_METERS) {
        return NextResponse.json({ 
          error: `Você está muito longe do local de trabalho. Distância: ${Math.round(distance)}m (máximo: ${SYSTEM_CONFIG.GEOLOCATION.ALLOWED_RADIUS_METERS}m)`,
          code: 'OUT_OF_RANGE',
          distance: Math.round(distance),
          maxDistance: SYSTEM_CONFIG.GEOLOCATION.ALLOWED_RADIUS_METERS
        }, { status: 403 })
      }
    }

    const horaSaida = new Date().toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: SYSTEM_CONFIG.TIMEZONE
    })

    // Registrar saída no Firebase
    await registrarSaida(usuario.email, horaSaida, locationData)

    return NextResponse.json({ 
      success: true, 
      horaSaida,
      location: locationData ? {
        validated: true,
        distance: calculateDistance(
          locationData.latitude,
          locationData.longitude,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
        )
      } : undefined
    })
  } catch (error) {
    console.error('Erro na API de saída:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar saída'
    
    return NextResponse.json({ 
      error: errorMessage,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}
