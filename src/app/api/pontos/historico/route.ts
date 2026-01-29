import { NextRequest, NextResponse } from 'next/server'
import { getPontosFuncionario } from '@/lib/firebaseDb'
import { verificarAutenticacao, criarRespostaErro } from '@/lib/authMiddleware'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const usuario = authResult.usuario!

    // Obter pontos do funcionário
    const pontos = await getPontosFuncionario(usuario.email)

    return NextResponse.json({ pontos })
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json({ 
      error: 'Erro ao obter histórico' 
    }, { status: 500 })
  }
}
