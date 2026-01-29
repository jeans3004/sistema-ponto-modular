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
    const { searchParams } = new URL(req.url)
    const funcionarioParam = searchParams.get('funcionario')

    let emailParaBuscar = usuario.email

    // Se um funcionário específico foi solicitado, verificar permissão
    if (funcionarioParam) {
      // Apenas administradores e coordenadores podem ver histórico de outros funcionários
      if (!usuario.niveisHierarquicos.includes('administrador') && 
          !usuario.niveisHierarquicos.includes('coordenador')) {
        return NextResponse.json({ 
          error: 'Acesso negado. Apenas administradores e coordenadores podem ver histórico de outros funcionários.' 
        }, { status: 403 })
      }
      
      emailParaBuscar = funcionarioParam
    }

    // Obter pontos do funcionário
    const pontos = await getPontosFuncionario(emailParaBuscar)
    
    // Log para debug se necessário
    if (pontos.length === 0) {
      console.log('Nenhum ponto encontrado para:', emailParaBuscar)
    }

    return NextResponse.json({ 
      pontos,
      funcionarioEmail: emailParaBuscar,
      totalRegistros: pontos.length
    })
  } catch (error) {
    console.error('Erro na API de histórico:', error)
    return NextResponse.json({ 
      error: 'Erro ao obter histórico' 
    }, { status: 500 })
  }
}
