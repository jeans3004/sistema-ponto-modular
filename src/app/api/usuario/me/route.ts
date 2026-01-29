import { NextRequest, NextResponse } from 'next/server'
import { verificarAutenticacao, criarRespostaErro } from '@/lib/authMiddleware'
import { criarOuAtualizarUsuario, trocarNivelAtivo } from '@/lib/firebaseUsers'
import { NivelHierarquico } from '@/types/usuario'

// GET - Obter dados do usuário atual
export async function GET(req: NextRequest) {
  try {
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const usuario = authResult.usuario!

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        foto: usuario.foto,
        niveisHierarquicos: usuario.niveisHierarquicos,
        nivelAtivo: usuario.nivelAtivo,
        status: usuario.status,
        configuracoes: usuario.configuracoes,
        dataCadastro: usuario.dataCadastro,
        ultimoAcesso: usuario.ultimoAcesso,
        // Campos de coordenação
        coordenacoes: usuario.coordenacoes,
        coordenacaoId: usuario.coordenacaoId,
        coordenacaoNome: usuario.coordenacaoNome,
        tipoColaborador: usuario.tipoColaborador,
      }
    })
  } catch (error) {
    console.error('Erro na API /usuario/me:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

// POST - Trocar nível ativo do usuário
export async function POST(req: NextRequest) {
  try {
    const authResult = await verificarAutenticacao(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const body = await req.json()
    const { novoNivel } = body

    if (!novoNivel) {
      return NextResponse.json({
        error: 'Novo nível é obrigatório',
        code: 'MISSING_NIVEL'
      }, { status: 400 })
    }

    // Validar se é um nível válido
    const niveisValidos: NivelHierarquico[] = ['administrador', 'coordenador', 'colaborador']
    if (!niveisValidos.includes(novoNivel)) {
      return NextResponse.json({
        error: 'Nível hierárquico inválido',
        code: 'INVALID_NIVEL'
      }, { status: 400 })
    }

    const usuario = authResult.usuario!

    // Verificar se o usuário tem permissão para este nível
    if (!usuario.niveisHierarquicos.includes(novoNivel)) {
      return NextResponse.json({
        error: 'Usuário não tem permissão para este nível hierárquico',
        code: 'UNAUTHORIZED_NIVEL'
      }, { status: 403 })
    }

    // Trocar nível ativo
    await trocarNivelAtivo(usuario.email, novoNivel)

    return NextResponse.json({
      success: true,
      message: 'Nível hierárquico alterado com sucesso',
      novoNivel
    })
  } catch (error) {
    console.error('Erro ao trocar nível:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao trocar nível hierárquico'
    
    return NextResponse.json({
      error: errorMessage,
      code: 'NIVEL_CHANGE_ERROR'
    }, { status: 500 })
  }
}