import { NextRequest, NextResponse } from 'next/server'
import { registrarEntrada } from '@/lib/firebaseDb'
import { calculateDistance } from '@/lib/geolocation'
import { SYSTEM_CONFIG } from '@/lib/config'
import { verificarAutenticacao, criarRespostaErro } from '@/lib/authMiddleware'
import { criarOuAtualizarUsuario } from '@/lib/firebaseUsers'

interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação e criar/atualizar usuário se necessário
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

    const agora = new Date()
    const horaEntrada = agora.toTimeString().slice(0, 5) // HH:MM

    // Registrar entrada no Firebase (com coordenadas se disponíveis)
    const resultado = await registrarEntrada(
      usuario.email, 
      horaEntrada,
      locationData
    )

    return NextResponse.json({ 
      success: true, 
      horaEntrada,
      id: resultado.id,
      location: locationData ? {
        validated: true,
        distance: locationData ? calculateDistance(
          locationData.latitude,
          locationData.longitude,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LATITUDE,
          SYSTEM_CONFIG.GEOLOCATION.WORKPLACE_LONGITUDE
        ) : undefined
      } : undefined
    })
  } catch (error) {
    console.error('Erro na API de entrada:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar entrada'
    
    return NextResponse.json({ 
      error: errorMessage,
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}
