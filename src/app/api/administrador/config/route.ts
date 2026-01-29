import { NextRequest, NextResponse } from 'next/server'
import { verificarAutenticacao } from '@/lib/authMiddleware'
import { adminDb } from '@/lib/firebaseAdmin'

interface SystemConfig {
  geolocation: {
    enabled: boolean
    workplaceLatitude: number
    workplaceLongitude: number
    allowedRadiusMeters: number
  }
  workday: {
    defaultHours: number
    maxHoursPerDay: number
  }
  lunchBreak: {
    defaultDurationHours: number
    defaultDurationMinutes: number
    minDurationMinutes: number
    maxDurationHours: number
  }
}

// GET - Obter configurações do sistema
export async function GET(req: NextRequest) {
  try {
    console.log("🔍 API de configurações GET iniciada")
    
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // Verificar se é administrador
    const isAdmin = authResult.usuario?.niveisHierarquicos?.includes('administrador')
    const isUsingAdminLevel = authResult.usuario?.nivelAtivo === 'administrador'
    
    if (!isAdmin || !isUsingAdminLevel) {
      return NextResponse.json({ 
        error: 'Acesso negado - você precisa ser administrador' 
      }, { status: 403 })
    }

    // Buscar configurações no Firestore
    const configDoc = await adminDb.collection('sistema').doc('config').get()
    
    if (configDoc.exists) {
      const config = configDoc.data()
      return NextResponse.json({
        success: true,
        config: config
      })
    } else {
      // Retornar configurações padrão se não existir documento
      const defaultConfig: SystemConfig = {
        geolocation: {
          enabled: false,
          workplaceLatitude: -15.7942,  // Brasília como padrão
          workplaceLongitude: -47.8822,
          allowedRadiusMeters: 100
        },
        workday: {
          defaultHours: 8,
          maxHoursPerDay: 12
        },
        lunchBreak: {
          defaultDurationHours: 1,
          defaultDurationMinutes: 0,
          minDurationMinutes: 30,
          maxDurationHours: 2
        }
      }

      return NextResponse.json({
        success: true,
        config: defaultConfig,
        isDefault: true
      })
    }
  } catch (error) {
    console.error('Erro na API de configurações GET:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

// POST - Atualizar configurações do sistema
export async function POST(req: NextRequest) {
  try {
    console.log("🔧 API de configurações POST iniciada")
    
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }

    // Verificar se é administrador
    const isAdmin = authResult.usuario?.niveisHierarquicos?.includes('administrador')
    const isUsingAdminLevel = authResult.usuario?.nivelAtivo === 'administrador'
    
    if (!isAdmin || !isUsingAdminLevel) {
      return NextResponse.json({ 
        error: 'Acesso negado - você precisa ser administrador' 
      }, { status: 403 })
    }

    const body = await req.json()
    const { config } = body

    if (!config) {
      return NextResponse.json({
        error: 'Configuração é obrigatória'
      }, { status: 400 })
    }

    // Validar configuração de geolocalização
    if (config.geolocation) {
      const { workplaceLatitude, workplaceLongitude, allowedRadiusMeters } = config.geolocation
      
      if (workplaceLatitude < -90 || workplaceLatitude > 90) {
        return NextResponse.json({
          error: 'Latitude inválida (deve estar entre -90 e 90)'
        }, { status: 400 })
      }
      
      if (workplaceLongitude < -180 || workplaceLongitude > 180) {
        return NextResponse.json({
          error: 'Longitude inválida (deve estar entre -180 e 180)'
        }, { status: 400 })
      }
      
      if (allowedRadiusMeters < 10 || allowedRadiusMeters > 10000) {
        return NextResponse.json({
          error: 'Raio de tolerância inválido (deve estar entre 10 e 10000 metros)'
        }, { status: 400 })
      }
    }

    // Salvar configurações no Firestore
    const configWithMetadata = {
      ...config,
      updatedAt: new Date(),
      updatedBy: authResult.usuario!.email
    }

    await adminDb.collection('sistema').doc('config').set(configWithMetadata, { merge: true })

    console.log("✅ Configurações atualizadas com sucesso")

    return NextResponse.json({
      success: true,
      message: 'Configurações atualizadas com sucesso',
      config: configWithMetadata
    })
  } catch (error) {
    console.error('Erro na API de configurações POST:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}