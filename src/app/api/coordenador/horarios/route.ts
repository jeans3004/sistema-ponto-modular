import { NextRequest, NextResponse } from 'next/server'
import { verificarCoordenadorOuAdmin, criarRespostaErro } from '@/lib/authMiddleware'
import { definirHorarioTrabalho, obterFuncionarios, obterUsuario } from '@/lib/firebaseUsers'
import { getCoordenacoesDoCoordenador } from '@/lib/firebaseDb'

// GET - Listar funcionários e seus horários
export async function GET(req: NextRequest) {
  try {
    const authResult = await verificarCoordenadorOuAdmin(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    // Verificar se é admin - admins veem todos os funcionários
    const isAdmin = authResult.usuario!.niveisHierarquicos?.includes('administrador')
    const nivelAtivo = authResult.usuario!.nivelAtivo
    
    let funcionarios = await obterFuncionarios()
    
    // Se for coordenador (incluindo quando é o nível ativo), aplicar filtro rigoroso
    if (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador')) {
      // Usar a mesma função que a interface "Minhas Coordenações" usa
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(authResult.usuario!.email)
      
      console.log("📋 Coordenações ativas para horários:", {
        email: authResult.usuario!.email,
        coordenacoes: coordenacoesAtivas,
        quantidade: coordenacoesAtivas.length,
        nivelAtivo: nivelAtivo
      })

      // Se não tem coordenações ativas, retornar lista vazia
      if (coordenacoesAtivas.length === 0) {
        console.log("❌ Coordenador sem coordenações ativas na API de horários")
        return NextResponse.json({
          success: true,
          funcionarios: [],
          coordenacoes: [],
          total: 0,
          message: "Coordenador não possui coordenações ativas atribuídas"
        })
      }

      // Filtrar funcionários apenas das coordenações ativas
      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      funcionarios = funcionarios.filter(funcionario => 
        funcionario.coordenacaoId && coordenacoesIds.includes(funcionario.coordenacaoId)
      )
      console.log(`🔍 Coordenador com coordenações ativas [${coordenacoesIds.join(', ')}] - ${funcionarios.length} funcionários encontrados`)
    }
    
    // Buscar coordenações do coordenador atual
    const coordenacoes = await getCoordenacoesDoCoordenador(authResult.usuario!.email)

    // Retornar apenas dados relevantes
    const funcionariosFormatados = funcionarios.map(funcionario => ({
      email: funcionario.email,
      nome: funcionario.nome,
      foto: funcionario.foto,
      status: funcionario.status,
      configuracoes: funcionario.configuracoes,
      niveisHierarquicos: funcionario.niveisHierarquicos,
      coordenacaoId: funcionario.coordenacaoId,
      coordenacaoNome: funcionario.coordenacaoNome,
    }))

    return NextResponse.json({
      success: true,
      funcionarios: funcionariosFormatados,
      coordenacoes: coordenacoes,
      total: funcionariosFormatados.length
    })
  } catch (error) {
    console.error('Erro na API coordenador/horarios GET:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

// POST - Definir horários de trabalho para um funcionário
export async function POST(req: NextRequest) {
  try {
    const authResult = await verificarCoordenadorOuAdmin(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const body = await req.json()
    const { emailFuncionario, horarios, tipoHorario } = body

    // Validar parâmetros obrigatórios
    if (!emailFuncionario || !horarios) {
      return NextResponse.json({
        error: 'Email do funcionário e horários são obrigatórios',
        code: 'MISSING_PARAMS'
      }, { status: 400 })
    }

    // Função para validar estrutura de horário
    const validarHorario = (horario: any, contexto: string) => {
      const { entrada, saida, inicioAlmoco, fimAlmoco } = horario

      if (!entrada || !saida || !inicioAlmoco || !fimAlmoco) {
        return `Todos os horários são obrigatórios para ${contexto}: entrada, saida, inicioAlmoco, fimAlmoco`
      }

      // Validar formato dos horários (HH:MM)
      const regexHorario = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      const horariosArray = [entrada, saida, inicioAlmoco, fimAlmoco]
      const nomes = ['entrada', 'saida', 'inicioAlmoco', 'fimAlmoco']

      for (let i = 0; i < horariosArray.length; i++) {
        if (!regexHorario.test(horariosArray[i])) {
          return `Formato inválido para ${nomes[i]} em ${contexto}. Use HH:MM (exemplo: 08:30)`
        }
      }

      // Verificar lógica dos horários
      const entradaTime = new Date(`2000-01-01T${entrada}:00`)
      const inicioAlmocoTime = new Date(`2000-01-01T${inicioAlmoco}:00`)
      const fimAlmocoTime = new Date(`2000-01-01T${fimAlmoco}:00`)
      const saidaTime = new Date(`2000-01-01T${saida}:00`)

      if (entradaTime >= inicioAlmocoTime) {
        return `Horário de entrada deve ser anterior ao início do almoço em ${contexto}`
      }

      if (inicioAlmocoTime >= fimAlmocoTime) {
        return `Início do almoço deve ser anterior ao fim do almoço em ${contexto}`
      }

      if (fimAlmocoTime >= saidaTime) {
        return `Fim do almoço deve ser anterior ao horário de saída em ${contexto}`
      }

      return null
    }

    // Validar horários baseado no tipo
    if (tipoHorario === 'geral') {
      const erro = validarHorario(horarios, 'horário geral')
      if (erro) {
        return NextResponse.json({
          error: erro,
          code: 'INVALID_HORARIOS'
        }, { status: 400 })
      }
    } else if (tipoHorario === 'dias') {
      // Para o novo sistema flexível, validar horário geral e dias específicos
      if (horarios.geral) {
        const erro = validarHorario(horarios.geral, 'horário geral')
        if (erro) {
          return NextResponse.json({
            error: erro,
            code: 'INVALID_HORARIOS'
          }, { status: 400 })
        }
      }
      
      // Validar dias específicos se existirem
      if (horarios.diasEspecificos) {
        for (const [dia, horario] of Object.entries(horarios.diasEspecificos)) {
          const erro = validarHorario(horario as any, `${dia}-feira`)
          if (erro) {
            return NextResponse.json({
              error: erro,
              code: 'INVALID_HORARIOS'
            }, { status: 400 })
          }
        }
      }
      
      // Fallback: validar formato antigo (cada dia da semana) para compatibilidade
      const diasSemana = ['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo']
      for (const dia of diasSemana) {
        if (horarios[dia] && !horarios.geral && !horarios.diasEspecificos) {
          const erro = validarHorario(horarios[dia], `${dia}-feira`)
          if (erro) {
            return NextResponse.json({
              error: erro,
              code: 'INVALID_HORARIOS'
            }, { status: 400 })
          }
        }
      }
    } else {
      return NextResponse.json({
        error: 'Tipo de horário deve ser "geral" ou "dias"',
        code: 'INVALID_TIPO_HORARIO'
      }, { status: 400 })
    }

    // Verificar se o funcionário existe e é colaborador
    const funcionario = await obterUsuario(emailFuncionario)
    
    if (!funcionario) {
      return NextResponse.json({
        error: 'Funcionário não encontrado',
        code: 'FUNCIONARIO_NOT_FOUND'
      }, { status: 404 })
    }

    if (!funcionario.niveisHierarquicos.includes('colaborador')) {
      return NextResponse.json({
        error: 'Horários só podem ser definidos para colaboradores',
        code: 'NOT_COLABORADOR'
      }, { status: 400 })
    }

    // Verificar se coordenador pode definir horários para este funcionário
    const isAdmin = authResult.usuario!.niveisHierarquicos?.includes('administrador')
    const nivelAtivo = authResult.usuario!.nivelAtivo
    
    if (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador')) {
      // Usar a mesma função que a interface "Minhas Coordenações" usa
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(authResult.usuario!.email)
      
      console.log("📋 Verificando permissão para definir horários:", {
        email: authResult.usuario!.email,
        coordenacoes: coordenacoesAtivas,
        quantidade: coordenacoesAtivas.length,
        funcionarioEmail: emailFuncionario,
        funcionarioCoordenacao: funcionario.coordenacaoId
      })

      // Se não tem coordenações ativas, negar acesso
      if (coordenacoesAtivas.length === 0) {
        return NextResponse.json({
          error: 'Você não possui coordenações ativas atribuídas para definir horários',
          code: 'NO_COORDENACAO_ASSIGNED'
        }, { status: 403 })
      }

      // Verificar se o funcionário pertence a uma das coordenações ativas
      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      if (!funcionario.coordenacaoId || !coordenacoesIds.includes(funcionario.coordenacaoId)) {
        return NextResponse.json({
          error: 'Você só pode definir horários para funcionários das suas coordenações ativas',
          code: 'NOT_SAME_COORDENACAO'
        }, { status: 403 })
      }
    }

    // Definir horários
    await definirHorarioTrabalho(
      emailFuncionario,
      horarios,
      authResult.usuario!.email,
      tipoHorario || 'geral'
    )

    return NextResponse.json({
      success: true,
      message: 'Horários de trabalho definidos com sucesso',
      funcionario: emailFuncionario,
      horarios: horarios,
      tipoHorario: tipoHorario || 'geral',
      definidoPor: authResult.usuario!.email
    })
  } catch (error) {
    console.error('Erro na API coordenador/horarios POST:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao definir horários'
    
    return NextResponse.json({
      error: errorMessage,
      code: 'HORARIO_ERROR'
    }, { status: 500 })
  }
}