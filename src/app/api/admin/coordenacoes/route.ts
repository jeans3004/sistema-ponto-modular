import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { 
  getCoordenacoes, 
  criarCoordenacao, 
  atualizarCoordenacao, 
  excluirCoordenacao,
  atribuirCoordenador,
  removerCoordenador 
} from '@/lib/firebaseDb'
import { obterUsuario } from '@/lib/firebaseUsers'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const usuario = await obterUsuario(session.user.email)
    
    if (!usuario || !usuario.niveisHierarquicos.includes('administrador')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const coordenacoes = await getCoordenacoes()

    return NextResponse.json({
      success: true,
      coordenacoes
    })

  } catch (error) {
    console.error('Erro ao buscar coordenações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
    }

    const usuario = await obterUsuario(session.user.email)
    
    if (!usuario || !usuario.niveisHierarquicos.includes('administrador')) {
      return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
    }

    const body = await request.json()
    const { acao, coordenacaoId, nome, descricao, coordenadorEmail, coordenadorNome } = body

    switch (acao) {
      case 'criar':
        if (!nome || !descricao) {
          return NextResponse.json({ error: 'Nome e descrição são obrigatórios' }, { status: 400 })
        }

        const resultCriar = await criarCoordenacao({
          nome,
          descricao,
          createdBy: session.user.email
        })

        if (!resultCriar.success) {
          return NextResponse.json({ error: resultCriar.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Coordenação criada com sucesso',
          id: resultCriar.id
        })

      case 'atualizar':
        if (!coordenacaoId) {
          return NextResponse.json({ error: 'ID da coordenação é obrigatório' }, { status: 400 })
        }

        const dadosAtualizacao: any = {}
        if (nome) dadosAtualizacao.nome = nome
        if (descricao) dadosAtualizacao.descricao = descricao

        const resultAtualizar = await atualizarCoordenacao(coordenacaoId, dadosAtualizacao)

        if (!resultAtualizar.success) {
          return NextResponse.json({ error: resultAtualizar.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Coordenação atualizada com sucesso'
        })

      case 'excluir':
        if (!coordenacaoId) {
          return NextResponse.json({ error: 'ID da coordenação é obrigatório' }, { status: 400 })
        }

        const resultExcluir = await excluirCoordenacao(coordenacaoId)

        if (!resultExcluir.success) {
          return NextResponse.json({ error: resultExcluir.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Coordenação excluída com sucesso'
        })

      case 'atribuir-coordenador':
        if (!coordenacaoId || !coordenadorEmail || !coordenadorNome) {
          return NextResponse.json({ 
            error: 'ID da coordenação, email e nome do coordenador são obrigatórios' 
          }, { status: 400 })
        }

        // Verificar se o usuário é realmente um coordenador
        const coordenador = await obterUsuario(coordenadorEmail)
        if (!coordenador || !coordenador.niveisHierarquicos.includes('coordenador')) {
          return NextResponse.json({ 
            error: 'Usuário não é um coordenador válido' 
          }, { status: 400 })
        }

        const resultAtribuir = await atribuirCoordenador(coordenacaoId, coordenadorEmail, coordenadorNome)

        if (!resultAtribuir.success) {
          return NextResponse.json({ error: resultAtribuir.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Coordenador atribuído com sucesso'
        })

      case 'remover-coordenador':
        if (!coordenacaoId) {
          return NextResponse.json({ error: 'ID da coordenação é obrigatório' }, { status: 400 })
        }

        const resultRemover = await removerCoordenador(coordenacaoId)

        if (!resultRemover.success) {
          return NextResponse.json({ error: resultRemover.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: 'Coordenador removido com sucesso'
        })

      case 'ativar-inativar':
        if (!coordenacaoId) {
          return NextResponse.json({ error: 'ID da coordenação é obrigatório' }, { status: 400 })
        }

        const ativo = body.ativo
        const resultStatus = await atualizarCoordenacao(coordenacaoId, { ativo })

        if (!resultStatus.success) {
          return NextResponse.json({ error: resultStatus.error }, { status: 400 })
        }

        return NextResponse.json({
          success: true,
          message: `Coordenação ${ativo ? 'ativada' : 'inativada'} com sucesso`
        })

      default:
        return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
    }

  } catch (error) {
    console.error('Erro na API de coordenações:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}