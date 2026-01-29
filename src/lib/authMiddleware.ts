import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { obterUsuario, verificarPermissao } from './firebaseUsers'
import { Usuario, NivelHierarquico, PERMISSOES_SISTEMA } from '@/types/usuario'

// Interface para resultado da autenticação
export interface AuthResult {
  success: boolean
  usuario?: Usuario
  error?: string
  status?: number
}

// Middleware principal de autenticação
export async function verificarAutenticacao(req?: NextRequest): Promise<AuthResult> {
  try {
    const session = await getServerSession()
    
    if (!session?.user?.email) {
      return {
        success: false,
        error: 'Usuário não autenticado',
        status: 401
      }
    }

    // Buscar dados do usuário no Firebase
    const usuario = await obterUsuario(session.user.email)
    
    if (!usuario) {
      return {
        success: false,
        error: 'Usuário não encontrado no sistema',
        status: 404
      }
    }

    if (usuario.status === 'pendente') {
      return {
        success: false,
        error: 'Usuário aguardando aprovação. Entre em contato com o administrador.',
        status: 403
      }
    }

    if (usuario.status === 'inativo') {
      return {
        success: false,
        error: 'Usuário inativo. Entre em contato com o administrador.',
        status: 403
      }
    }

    return {
      success: true,
      usuario
    }
  } catch (error) {
    console.error('Erro na verificação de autenticação:', error)
    return {
      success: false,
      error: 'Erro interno do servidor',
      status: 500
    }
  }
}

// Middleware para verificar permissão específica
export async function verificarPermissaoAPI(
  permissao: keyof typeof PERMISSOES_SISTEMA.administrador.permissoes,
  req?: NextRequest
): Promise<AuthResult> {
  const authResult = await verificarAutenticacao(req)
  
  if (!authResult.success) {
    return authResult
  }

  const temPermissao = verificarPermissao(authResult.usuario!, permissao)
  
  if (!temPermissao) {
    return {
      success: false,
      error: 'Usuário não tem permissão para esta ação',
      status: 403
    }
  }

  return authResult
}

// Middleware para verificar nível hierárquico
export async function verificarNivel(
  nivelRequerido: NivelHierarquico,
  req?: NextRequest
): Promise<AuthResult> {
  const authResult = await verificarAutenticacao(req)
  
  if (!authResult.success) {
    return authResult
  }

  const usuario = authResult.usuario!
  
  if (!usuario.niveisHierarquicos.includes(nivelRequerido)) {
    return {
      success: false,
      error: `Acesso restrito para ${nivelRequerido}`,
      status: 403
    }
  }

  return authResult
}

// Middleware para verificar se é admin
export async function verificarAdmin(req?: NextRequest): Promise<AuthResult> {
  return verificarNivel('administrador', req)
}

// Middleware para verificar se é coordenador ou admin
export async function verificarCoordenadorOuAdmin(req?: NextRequest): Promise<AuthResult> {
  const authResult = await verificarAutenticacao(req)
  
  if (!authResult.success) {
    return authResult
  }

  const usuario = authResult.usuario!
  const temPermissao = usuario.niveisHierarquicos.includes('administrador') || 
                      usuario.niveisHierarquicos.includes('coordenador')
  
  if (!temPermissao) {
    return {
      success: false,
      error: 'Acesso restrito para coordenadores e administradores',
      status: 403
    }
  }

  return authResult
}

// Função utilitária para criar resposta de erro
export function criarRespostaErro(authResult: AuthResult) {
  return new Response(
    JSON.stringify({ 
      error: authResult.error,
      code: 'AUTH_ERROR'
    }), 
    { 
      status: authResult.status || 500,
      headers: { 'Content-Type': 'application/json' }
    }
  )
}

// Hook para verificar se usuário logado pode gerenciar outro usuário
export function podeGerenciarUsuario(usuarioLogado: Usuario, usuarioAlvo: Usuario): boolean {
  // Admin pode gerenciar qualquer um
  if (usuarioLogado.niveisHierarquicos.includes('administrador')) {
    return true
  }

  // Coordenador pode gerenciar colaboradores
  if (usuarioLogado.niveisHierarquicos.includes('coordenador')) {
    return usuarioAlvo.niveisHierarquicos.includes('colaborador') && 
           !usuarioAlvo.niveisHierarquicos.includes('administrador')
  }

  // Colaborador não pode gerenciar ninguém
  return false
}