import { NextRequest, NextResponse } from 'next/server'
import { verificarCoordenadorOuAdmin, criarRespostaErro } from '@/lib/authMiddleware'
import { definirHorarioTrabalho, obterFuncionarios, obterUsuario } from '@/lib/firebaseUsers'

// GET - Listar funcionários e seus horários
export async function GET(req: NextRequest) {
  try {
    const authResult = await verificarCoordenadorOuAdmin(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const funcionarios = await obterFuncionarios()

    // Retornar apenas dados relevantes
    const funcionariosFormatados = funcionarios.map(funcionario => ({
      email: funcionario.email,
      nome: funcionario.nome,
      foto: funcionario.foto,
      status: funcionario.status,
      configuracoes: funcionario.configuracoes,
      niveisHierarquicos: funcionario.niveisHierarquicos,
    }))

    return NextResponse.json({
      success: true,
      funcionarios: funcionariosFormatados,
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
    const { emailFuncionario, horarios } = body

    // Validar parâmetros obrigatórios
    if (!emailFuncionario || !horarios) {
      return NextResponse.json({
        error: 'Email do funcionário e horários são obrigatórios',
        code: 'MISSING_PARAMS'
      }, { status: 400 })
    }

    // Validar estrutura dos horários
    const { entrada, saida, inicioAlmoco, fimAlmoco } = horarios

    if (!entrada || !saida || !inicioAlmoco || !fimAlmoco) {
      return NextResponse.json({
        error: 'Todos os horários são obrigatórios: entrada, saida, inicioAlmoco, fimAlmoco',
        code: 'MISSING_HORARIOS'
      }, { status: 400 })
    }

    // Validar formato dos horários (HH:MM)
    const regexHorario = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    const horariosArray = [entrada, saida, inicioAlmoco, fimAlmoco]
    const nomes = ['entrada', 'saida', 'inicioAlmoco', 'fimAlmoco']

    for (let i = 0; i < horariosArray.length; i++) {
      if (!regexHorario.test(horariosArray[i])) {
        return NextResponse.json({
          error: `Formato inválido para ${nomes[i]}. Use HH:MM (exemplo: 08:30)`,
          code: 'INVALID_TIME_FORMAT'
        }, { status: 400 })
      }
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

    // Verificar lógica dos horários
    const entradaTime = new Date(`2000-01-01T${entrada}:00`)
    const inicioAlmocoTime = new Date(`2000-01-01T${inicioAlmoco}:00`)
    const fimAlmocoTime = new Date(`2000-01-01T${fimAlmoco}:00`)
    const saidaTime = new Date(`2000-01-01T${saida}:00`)

    if (entradaTime >= inicioAlmocoTime) {
      return NextResponse.json({
        error: 'Horário de entrada deve ser anterior ao início do almoço',
        code: 'INVALID_HORARIO_SEQUENCE'
      }, { status: 400 })
    }

    if (inicioAlmocoTime >= fimAlmocoTime) {
      return NextResponse.json({
        error: 'Início do almoço deve ser anterior ao fim do almoço',
        code: 'INVALID_ALMOCO_SEQUENCE'
      }, { status: 400 })
    }

    if (fimAlmocoTime >= saidaTime) {
      return NextResponse.json({
        error: 'Fim do almoço deve ser anterior ao horário de saída',
        code: 'INVALID_SAIDA_SEQUENCE'
      }, { status: 400 })
    }

    // Definir horários
    await definirHorarioTrabalho(
      emailFuncionario,
      { entrada, saida, inicioAlmoco, fimAlmoco },
      authResult.usuario!.email
    )

    return NextResponse.json({
      success: true,
      message: 'Horários de trabalho definidos com sucesso',
      funcionario: emailFuncionario,
      horarios: { entrada, saida, inicioAlmoco, fimAlmoco },
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