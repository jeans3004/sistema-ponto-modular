import { NextRequest, NextResponse } from 'next/server'
import { verificarAutenticacao } from '@/lib/authMiddleware'
import { registrarInicioHtp } from '@/lib/firebaseDb'

export async function POST(req: NextRequest) {
  try {
    console.log('🕐 API inicio-htp iniciada')
    
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    if (!authResult.success) {
      return NextResponse.json({
        success: false,
        error: authResult.error || 'Usuário não autenticado'
      }, { status: authResult.status || 401 })
    }

    const usuario = authResult.usuario!
    console.log('👤 Usuário autenticado:', usuario.email)

    // Verificar se é docente
    if (usuario.tipoColaborador !== 'docente') {
      console.log('❌ Usuário não é docente:', usuario.tipoColaborador)
      return NextResponse.json({
        success: false,
        error: 'Apenas docentes podem registrar HTP'
      }, { status: 403 })
    }

    // Verificar se tem nível colaborador
    if (!usuario.niveisHierarquicos.includes('colaborador')) {
      console.log('❌ Usuário não tem nível colaborador')
      return NextResponse.json({
        success: false,
        error: 'Acesso negado'
      }, { status: 403 })
    }

    const body = await req.json()
    const { location } = body
    
    console.log('📍 Dados de localização recebidos:', location ? 'Sim' : 'Não')

    try {
      const horaAtual = new Date().toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo'
      })

      const resultado = await registrarInicioHtp(
        usuario.email,
        horaAtual,
        location
      )

      console.log('✅ Início de HTP registrado com sucesso')
      
      return NextResponse.json({
        success: true,
        message: 'Início de HTP registrado com sucesso',
        horaInicioHtp: horaAtual,
        location: location ? {
          validated: true,
          distance: 'Dentro da área permitida'
        } : undefined
      })
    } catch (error) {
      console.error('❌ Erro ao registrar início de HTP:', error)
      
      if (error instanceof Error) {
        return NextResponse.json({
          success: false,
          error: error.message
        }, { status: 400 })
      }
      
      return NextResponse.json({
        success: false,
        error: 'Erro interno do servidor'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('💥 Erro geral na API inicio-htp:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Erro interno do servidor'
    }, { status: 500 })
  }
}