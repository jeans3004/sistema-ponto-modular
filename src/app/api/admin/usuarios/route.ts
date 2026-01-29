import { NextRequest, NextResponse } from 'next/server'
import { verificarAdmin, criarRespostaErro } from '@/lib/authMiddleware'
import { 
  listarUsuarios, 
  listarUsuariosPendentes, 
  aprovarUsuario, 
  rejeitarUsuario,
  alterarNiveisUsuario 
} from '@/lib/firebaseUsers'
import { NivelHierarquico } from '@/types/usuario'

// GET - Listar usuários (com filtros opcionais)
export async function GET(req: NextRequest) {
  try {
    const authResult = await verificarAdmin(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status') // 'pendente', 'ativo', 'inativo'

    let usuarios
    
    if (status === 'pendente') {
      usuarios = await listarUsuariosPendentes()
    } else {
      usuarios = await listarUsuarios()
      
      // Filtrar por status se especificado
      if (status) {
        usuarios = usuarios.filter(u => u.status === status)
      }
    }

    return NextResponse.json({
      success: true,
      usuarios,
      total: usuarios.length
    })
  } catch (error) {
    console.error('Erro na API admin/usuarios GET:', error)
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}

// POST - Aprovar, rejeitar ou alterar usuário
export async function POST(req: NextRequest) {
  try {
    const authResult = await verificarAdmin(req)
    
    if (!authResult.success) {
      return criarRespostaErro(authResult)
    }

    const body = await req.json()
    const { acao, emailUsuario, niveisHierarquicos } = body

    if (!acao || !emailUsuario) {
      return NextResponse.json({
        error: 'Ação e email do usuário são obrigatórios',
        code: 'MISSING_PARAMS'
      }, { status: 400 })
    }

    const emailAdmin = authResult.usuario!.email

    switch (acao) {
      case 'aprovar':
        // Níveis padrão se não especificado
        const niveisIniciais: NivelHierarquico[] = niveisHierarquicos || ['colaborador']
        
        // Validar níveis
        const niveisValidos: NivelHierarquico[] = ['administrador', 'coordenador', 'colaborador']
        const niveisInvalidos = niveisIniciais.filter(n => !niveisValidos.includes(n))
        
        if (niveisInvalidos.length > 0) {
          return NextResponse.json({
            error: `Níveis inválidos: ${niveisInvalidos.join(', ')}`,
            code: 'INVALID_NIVEIS'
          }, { status: 400 })
        }

        await aprovarUsuario(emailUsuario, emailAdmin, niveisIniciais)
        
        return NextResponse.json({
          success: true,
          message: 'Usuário aprovado com sucesso',
          niveisAtribuidos: niveisIniciais
        })

      case 'rejeitar':
        await rejeitarUsuario(emailUsuario)
        
        return NextResponse.json({
          success: true,
          message: 'Usuário rejeitado'
        })

      case 'alterar-niveis':
        if (!niveisHierarquicos || niveisHierarquicos.length === 0) {
          return NextResponse.json({
            error: 'Níveis hierárquicos são obrigatórios para alteração',
            code: 'MISSING_NIVEIS'
          }, { status: 400 })
        }

        // Validar níveis
        const niveisValidosAlt: NivelHierarquico[] = ['administrador', 'coordenador', 'colaborador']
        const niveisInvalidosAlt = niveisHierarquicos.filter((n: string) => !(niveisValidosAlt as string[]).includes(n))
        
        if (niveisInvalidosAlt.length > 0) {
          return NextResponse.json({
            error: `Níveis inválidos: ${niveisInvalidosAlt.join(', ')}`,
            code: 'INVALID_NIVEIS'
          }, { status: 400 })
        }

        await alterarNiveisUsuario(emailUsuario, niveisHierarquicos, emailAdmin)
        
        return NextResponse.json({
          success: true,
          message: 'Níveis hierárquicos alterados com sucesso',
          novosNiveis: niveisHierarquicos
        })

      default:
        return NextResponse.json({
          error: 'Ação inválida. Ações permitidas: aprovar, rejeitar, alterar-niveis',
          code: 'INVALID_ACTION'
        }, { status: 400 })
    }
  } catch (error) {
    console.error('Erro na API admin/usuarios POST:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro ao processar ação'
    
    return NextResponse.json({
      error: errorMessage,
      code: 'ACTION_ERROR'
    }, { status: 500 })
  }
}