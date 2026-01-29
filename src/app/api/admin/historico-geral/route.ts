import { NextRequest, NextResponse } from 'next/server'
import { verificarCoordenadorOuAdmin } from '@/lib/authMiddleware'
import { obterFuncionarios } from '@/lib/firebaseUsers'
import { getPontosFuncionario, getCoordenacoesDoCoordenador } from '@/lib/firebaseDb'

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticação e permissões (coordenador ou admin)
    const authResult = await verificarCoordenadorOuAdmin(request)
    if (!authResult.success || !authResult.usuario) {
      return NextResponse.json(
        { error: authResult.error || 'Não autorizado' },
        { status: authResult.status || 401 }
      )
    }

    const { usuario } = authResult

    // Obter parâmetros de consulta
    const searchParams = request.nextUrl.searchParams
    const dataInicio = searchParams.get('dataInicio')
    const dataFim = searchParams.get('dataFim')
    const limite = parseInt(searchParams.get('limite') || '100')

    // Verificar nível do usuário e aplicar filtro de coordenação
    const isAdmin = usuario.niveisHierarquicos?.includes('administrador')
    const isCoordenador = usuario.niveisHierarquicos?.includes('coordenador')
    const nivelAtivo = usuario.nivelAtivo

    console.log('📋 Verificação de permissões histórico geral:', {
      email: usuario.email,
      isAdmin,
      isCoordenador,
      nivelAtivo
    })

    // Obter funcionários (colaboradores ativos)
    let usuariosAtivos = await obterFuncionarios()
    console.log('📊 Total de funcionários no sistema:', usuariosAtivos.length)

    // Se for coordenador (incluindo quando é o nível ativo), aplicar filtro rigoroso
    if (isCoordenador && (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador'))) {
      // Usar a mesma função que a interface "Minhas Coordenações" usa
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(usuario.email)
      
      console.log('📋 Coordenações ativas para histórico geral:', {
        email: usuario.email,
        coordenacoes: coordenacoesAtivas,
        quantidade: coordenacoesAtivas.length,
        nivelAtivo: nivelAtivo
      })

      // Se não tem coordenações ativas, retornar lista vazia
      if (coordenacoesAtivas.length === 0) {
        console.log('❌ Coordenador sem coordenações ativas no histórico geral')
        return NextResponse.json({
          sucesso: true,
          historico: [],
          estatisticas: {
            totalFuncionarios: 0,
            totalRegistros: 0,
            horasTrabalhadasTotal: 0,
            funcionariosAtivos: 0
          },
          filtros: { dataInicio, dataFim, limite },
          message: "Coordenador não possui coordenações ativas atribuídas"
        })
      }

      // Filtrar funcionários apenas das coordenações ativas
      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      usuariosAtivos = usuariosAtivos.filter(funcionario => 
        funcionario.coordenacaoId && coordenacoesIds.includes(funcionario.coordenacaoId)
      )
      console.log(`🔍 Coordenador com coordenações ativas [${coordenacoesIds.join(', ')}] - ${usuariosAtivos.length} funcionários no histórico`)
    }

    console.log('📊 Funcionários filtrados para histórico:', usuariosAtivos.length)

    // Obter histórico de pontos para cada usuário
    const historicoGeral = await Promise.all(
      usuariosAtivos.map(async (funcionario) => {
        try {
          let pontos = await getPontosFuncionario(funcionario.email)
          
          // Aplicar filtros de data se fornecidos
          if (dataInicio) {
            pontos = pontos.filter(p => p.data >= dataInicio)
          }
          if (dataFim) {
            pontos = pontos.filter(p => p.data <= dataFim)
          }
          
          // Limitar para visão resumida
          pontos = pontos.slice(0, 10)

          // Calcular estatísticas resumidas
          const totalDias = pontos.length
          const diasCompletos = pontos.filter(p => p.horaEntrada && p.horaSaida).length
          const horasTrabalhadas = pontos.reduce((total, ponto) => {
            if (ponto.horaEntrada && ponto.horaSaida) {
              const entrada = new Date(`1970-01-01T${ponto.horaEntrada}:00`)
              const saida = new Date(`1970-01-01T${ponto.horaSaida}:00`)
              const almoco = ponto.inicioAlmoco && ponto.fimAlmoco ? 
                (new Date(`1970-01-01T${ponto.fimAlmoco}:00`).getTime() - 
                 new Date(`1970-01-01T${ponto.inicioAlmoco}:00`).getTime()) / (1000 * 60 * 60) : 1
              
              const horas = (saida.getTime() - entrada.getTime()) / (1000 * 60 * 60) - almoco
              return total + Math.max(0, horas)
            }
            return total
          }, 0)

          return {
            funcionario: {
              email: funcionario.email,
              nome: funcionario.nome,
              foto: funcionario.foto,
              configuracoes: funcionario.configuracoes
            },
            estatisticas: {
              totalDias,
              diasCompletos,
              horasTrabalhadas: Math.round(horasTrabalhadas * 100) / 100,
              ultimoRegistro: pontos[0]?.data || null
            },
            pontosRecentes: pontos.slice(0, 5) // 5 registros mais recentes
          }
        } catch (error) {
          console.error(`Erro ao obter pontos para ${funcionario.email}:`, error)
          return {
            funcionario: {
              email: funcionario.email,
              nome: funcionario.nome,
              foto: funcionario.foto,
              configuracoes: funcionario.configuracoes
            },
            estatisticas: {
              totalDias: 0,
              diasCompletos: 0,
              horasTrabalhadas: 0,
              ultimoRegistro: null
            },
            pontosRecentes: [],
            erro: 'Erro ao carregar dados'
          }
        }
      })
    )

    // Ordenar por último registro (mais recente primeiro)
    historicoGeral.sort((a, b) => {
      const dataA = a.estatisticas.ultimoRegistro ? new Date(a.estatisticas.ultimoRegistro).getTime() : 0
      const dataB = b.estatisticas.ultimoRegistro ? new Date(b.estatisticas.ultimoRegistro).getTime() : 0
      return dataB - dataA
    })

    // Estatísticas gerais
    const estatisticasGerais = {
      totalFuncionarios: usuariosAtivos.length,
      totalRegistros: historicoGeral.reduce((total, item) => total + item.estatisticas.totalDias, 0),
      horasTrabalhadasTotal: historicoGeral.reduce((total, item) => total + item.estatisticas.horasTrabalhadas, 0),
      funcionariosAtivos: historicoGeral.filter(item => {
        const ultimoRegistro = item.estatisticas.ultimoRegistro
        if (!ultimoRegistro) return false
        const agora = new Date()
        const dataUltimoRegistro = new Date(ultimoRegistro)
        const diferencaDias = (agora.getTime() - dataUltimoRegistro.getTime()) / (1000 * 60 * 60 * 24)
        return diferencaDias <= 7 // Ativo se registrou nos últimos 7 dias
      }).length
    }

    return NextResponse.json({
      sucesso: true,
      historico: historicoGeral,
      estatisticas: estatisticasGerais,
      filtros: {
        dataInicio,
        dataFim,
        limite
      }
    })

  } catch (error) {
    console.error('Erro ao obter histórico geral:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor ao obter histórico geral' },
      { status: 500 }
    )
  }
}