import { NextRequest, NextResponse } from 'next/server'
import { registrarAusenciaJustificada, getAusenciasJustificadas } from '@/lib/firebaseDb'
import { verificarAutenticacao, criarRespostaErro } from '@/lib/authMiddleware'

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const usuario = authResult.usuario!

    const body = await req.json()
    const { data, tipo, justificativa, linkDocumento } = body

    // Validar dados obrigatórios
    if (!data || !tipo || !justificativa) {
      return NextResponse.json({ 
        error: 'Data, tipo e justificativa são obrigatórios' 
      }, { status: 400 })
    }

    // Validar tipos permitidos
    const tiposPermitidos = ['falta', 'atestado', 'licenca']
    if (!tiposPermitidos.includes(tipo)) {
      return NextResponse.json({ 
        error: 'Tipo de ausência inválido' 
      }, { status: 400 })
    }

    // Registrar ausência no Firebase
    const resultado = await registrarAusenciaJustificada(
      usuario.email, 
      data, 
      tipo, 
      justificativa,
      linkDocumento
    )

    return NextResponse.json({ 
      success: true, 
      id: resultado.id,
      message: 'Ausência registrada com sucesso. Aguardando análise da documentação.'
    })
  } catch (error) {
    console.error('Erro na API de ausência:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao registrar ausência'
    
    return NextResponse.json({ 
      error: errorMessage 
    }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const usuario = authResult.usuario!

    // Buscar ausências do funcionário
    const ausencias = await getAusenciasJustificadas(usuario.email)

    return NextResponse.json({ 
      success: true, 
      ausencias 
    })
  } catch (error) {
    console.error('Erro ao buscar ausências:', error)
    
    return NextResponse.json({ 
      error: 'Erro ao buscar ausências' 
    }, { status: 500 })
  }
}