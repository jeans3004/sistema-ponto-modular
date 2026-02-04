import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { obterUsuario, obterFuncionarios } from '@/lib/firebaseUsers'
import { getCoordenacoesDoCoordenador, getCoordenacoes } from '@/lib/firebaseDb'

// GET - Diagnóstico do coordenador
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({
        success: false,
        error: 'Não autenticado'
      }, { status: 401 })
    }

    const usuario = await obterUsuario(session.user.email)

    if (!usuario) {
      return NextResponse.json({
        success: false,
        error: 'Usuário não encontrado no sistema'
      }, { status: 404 })
    }

    // Verificar se é coordenador ou admin
    const isAdmin = usuario.niveisHierarquicos?.includes('administrador')
    const isCoordenador = usuario.niveisHierarquicos?.includes('coordenador')

    if (!isAdmin && !isCoordenador) {
      return NextResponse.json({
        success: false,
        error: 'Acesso negado - você precisa ser coordenador ou administrador'
      }, { status: 403 })
    }

    // Buscar coordenações onde o usuário é o coordenador
    const coordenacoesComoCoordenador = await getCoordenacoesDoCoordenador(session.user.email)

    // Buscar todas as coordenações (para admin ver o panorama geral)
    const todasCoordenacoes = isAdmin ? await getCoordenacoes() : []

    // Buscar todos os funcionários
    const todosFuncionarios = await obterFuncionarios()

    // Filtrar funcionários das coordenações do coordenador
    const coordenacoesIds = coordenacoesComoCoordenador.map(c => c.id)
    const funcionariosDasCoordenacoes = todosFuncionarios.filter(f =>
      f.coordenacaoId && coordenacoesIds.includes(f.coordenacaoId)
    )

    // Funcionários sem coordenação
    const funcionariosSemCoordenacao = todosFuncionarios.filter(f => !f.coordenacaoId)

    // Montar diagnóstico
    const diagnostico = {
      usuario: {
        email: usuario.email,
        nome: usuario.nome,
        niveisHierarquicos: usuario.niveisHierarquicos,
        nivelAtivo: usuario.nivelAtivo,
        status: usuario.status,
        // Campos de coordenação do próprio usuário (se ele também for funcionário)
        coordenacaoIdPropria: usuario.coordenacaoId || null,
        coordenacaoNomePropria: usuario.coordenacaoNome || null,
      },

      coordenacoesComoCoordenador: {
        quantidade: coordenacoesComoCoordenador.length,
        lista: coordenacoesComoCoordenador.map(c => ({
          id: c.id,
          nome: c.nome,
          descricao: c.descricao,
          ativo: c.ativo,
          coordenadorEmail: c.coordenadorEmail,
        })),
        mensagem: coordenacoesComoCoordenador.length === 0
          ? '⚠️ PROBLEMA: Você não está atribuído como coordenador de nenhuma coordenação. Peça ao admin para atribuí-lo em Administrador > Coordenações.'
          : `✅ Você é coordenador de ${coordenacoesComoCoordenador.length} coordenação(ões).`
      },

      funcionariosDasCoordenacoes: {
        quantidade: funcionariosDasCoordenacoes.length,
        lista: funcionariosDasCoordenacoes.map(f => ({
          email: f.email,
          nome: f.nome,
          coordenacaoId: f.coordenacaoId,
          coordenacaoNome: f.coordenacaoNome,
          status: f.status,
        })),
        mensagem: funcionariosDasCoordenacoes.length === 0 && coordenacoesComoCoordenador.length > 0
          ? '⚠️ PROBLEMA: Nenhum funcionário está atribuído às suas coordenações. Peça ao admin para vincular funcionários em Administrador > Funcionários.'
          : funcionariosDasCoordenacoes.length > 0
            ? `✅ ${funcionariosDasCoordenacoes.length} funcionário(s) nas suas coordenações.`
            : 'ℹ️ Sem funcionários (você não tem coordenações atribuídas).'
      },

      resumoGeral: {
        totalFuncionariosNoSistema: todosFuncionarios.length,
        funcionariosSemCoordenacao: funcionariosSemCoordenacao.length,
        listaFuncionariosSemCoordenacao: funcionariosSemCoordenacao.slice(0, 10).map(f => ({
          email: f.email,
          nome: f.nome,
        })),
      },

      // Informações extras para admin
      ...(isAdmin && {
        todasCoordenacoes: {
          quantidade: todasCoordenacoes.length,
          lista: todasCoordenacoes.map(c => ({
            id: c.id,
            nome: c.nome,
            coordenadorEmail: c.coordenadorEmail || '(sem coordenador)',
            ativo: c.ativo,
            quantidadeFuncionarios: todosFuncionarios.filter(f => f.coordenacaoId === c.id).length,
          })),
        },
      }),

      acoes: [] as string[],
    }

    // Sugerir ações
    if (coordenacoesComoCoordenador.length === 0) {
      diagnostico.acoes.push('1. Vá em Administrador > Coordenações')
      diagnostico.acoes.push('2. Clique em "Atribuir" em uma coordenação')
      diagnostico.acoes.push(`3. Selecione o usuário: ${usuario.email}`)
    } else if (funcionariosDasCoordenacoes.length === 0) {
      diagnostico.acoes.push('1. Vá em Administrador > Funcionários')
      diagnostico.acoes.push('2. Clique em um funcionário')
      diagnostico.acoes.push(`3. Atribua-o a uma das coordenações: ${coordenacoesComoCoordenador.map(c => c.nome).join(', ')}`)
    }

    return NextResponse.json({
      success: true,
      diagnostico,
      timestamp: new Date().toISOString(),
    })

  } catch (error) {
    console.error('Erro no diagnóstico:', error)
    return NextResponse.json({
      success: false,
      error: 'Erro interno ao gerar diagnóstico',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
