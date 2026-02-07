import { NextRequest, NextResponse } from 'next/server'
import { verificarCoordenadorOuAdmin, criarRespostaErro } from '@/lib/authMiddleware'
import { obterFuncionarios } from '@/lib/firebaseUsers'
import { getCoordenacoesDoCoordenador, getAusenciasPorCoordenacao, atualizarStatusAusencia } from '@/lib/firebaseDb'

// GET - Listar ausências dos funcionários da coordenação
export async function GET(req: NextRequest) {
  try {
    const authResult = await verificarCoordenadorOuAdmin(req)

    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const isAdmin = authResult.usuario!.niveisHierarquicos?.includes('administrador')
    const nivelAtivo = authResult.usuario!.nivelAtivo

    let funcionarios = await obterFuncionarios()

    // Se for coordenador, filtrar apenas funcionários das suas coordenações
    if (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador')) {
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(authResult.usuario!.email)

      if (coordenacoesAtivas.length === 0) {
        return NextResponse.json({
          success: true,
          ausencias: [],
          total: 0,
          message: 'Coordenador não possui coordenações ativas atribuídas'
        })
      }

      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      funcionarios = funcionarios.filter(f =>
        f.coordenacaoId && coordenacoesIds.includes(f.coordenacaoId)
      )
    }

    const funcionariosEmails = funcionarios.map(f => f.email)

    // Buscar ausências desses funcionários
    const ausencias = await getAusenciasPorCoordenacao(funcionariosEmails)

    // Enriquecer com nome do funcionário
    const ausenciasComNome = ausencias.map(a => {
      const func = funcionarios.find(f => f.email === a.funcionarioEmail)
      return {
        ...a,
        funcionarioNome: func?.nome || a.funcionarioEmail,
      }
    })

    return NextResponse.json({
      success: true,
      ausencias: ausenciasComNome,
      total: ausenciasComNome.length
    })
  } catch (error) {
    console.error('Erro na API coordenador/ausencias GET:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

// PUT - Atualizar status de uma ausência (aprovar/reprovar)
export async function PUT(req: NextRequest) {
  try {
    const authResult = await verificarCoordenadorOuAdmin(req)

    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const body = await req.json()
    const { ausenciaId, status, motivo } = body

    if (!ausenciaId || !status) {
      return NextResponse.json({
        error: 'ausenciaId e status são obrigatórios',
        code: 'MISSING_PARAMS'
      }, { status: 400 })
    }

    if (!['aprovada', 'rejeitada'].includes(status)) {
      return NextResponse.json({
        error: 'Status deve ser "aprovada" ou "rejeitada"',
        code: 'INVALID_STATUS'
      }, { status: 400 })
    }

    // Verificar que o coordenador tem acesso ao funcionário dessa ausência
    const isAdmin = authResult.usuario!.niveisHierarquicos?.includes('administrador')
    const nivelAtivo = authResult.usuario!.nivelAtivo

    if (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador')) {
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(authResult.usuario!.email)

      if (coordenacoesAtivas.length === 0) {
        return NextResponse.json({
          error: 'Você não possui coordenações ativas atribuídas',
          code: 'NO_COORDENACAO_ASSIGNED'
        }, { status: 403 })
      }

      // Buscar funcionários das coordenações do coordenador para verificar permissão
      const funcionarios = await obterFuncionarios()
      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      const funcionariosDaCoordenacao = funcionarios.filter(f =>
        f.coordenacaoId && coordenacoesIds.includes(f.coordenacaoId)
      )

      // Buscar a ausência para verificar o email do funcionário
      const ausencias = await getAusenciasPorCoordenacao(funcionariosDaCoordenacao.map(f => f.email))
      const ausenciaAlvo = ausencias.find(a => a.id === ausenciaId)

      if (!ausenciaAlvo) {
        return NextResponse.json({
          error: 'Ausência não encontrada ou não pertence a um funcionário da sua coordenação',
          code: 'AUSENCIA_NOT_FOUND'
        }, { status: 404 })
      }
    }

    const resultado = await atualizarStatusAusencia(
      ausenciaId,
      status,
      authResult.usuario!.email,
      motivo
    )

    if (!resultado.success) {
      return NextResponse.json({
        error: resultado.error,
        code: 'UPDATE_ERROR'
      }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: `Ausência ${status === 'aprovada' ? 'aprovada' : 'rejeitada'} com sucesso`,
      ausenciaId,
      status,
      analisadoPor: authResult.usuario!.email
    })
  } catch (error) {
    console.error('Erro na API coordenador/ausencias PUT:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}
