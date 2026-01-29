'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Usuario, NivelHierarquico, PERMISSOES_SISTEMA } from '@/types/usuario'

interface UseUsuarioReturn {
  usuario: Usuario | null
  isLoading: boolean
  error: string | null
  temPermissao: (permissao: keyof typeof PERMISSOES_SISTEMA.administrador.permissoes) => boolean
  temNivel: (nivel: NivelHierarquico) => boolean
  trocarNivel: (novoNivel: NivelHierarquico) => Promise<boolean>
  sincronizar: () => Promise<void>
  isPendente: boolean
  isInativo: boolean
  isAtivo: boolean
}

export function useUsuario(): UseUsuarioReturn {
  const { data: session, status } = useSession()
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Função para sincronizar usuário
  const sincronizar = async () => {
    if (!session?.user?.email) return

    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/auth/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await response.json()

      if (data.success) {
        setUsuario(data.usuario)
      } else {
        setError(data.error || 'Erro ao sincronizar usuário')
      }
    } catch (err) {
      console.error('Erro na sincronização:', err)
      setError('Erro de conexão ao sincronizar usuário')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para obter dados do usuário atual
  const obterUsuario = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/usuario/me')
      const data = await response.json()

      if (data.success) {
        setUsuario(data.usuario)
      } else {
        // Se usuário não existe, sincronizar
        if (response.status === 404) {
          await sincronizar()
        } else {
          setError(data.error || 'Erro ao obter dados do usuário')
        }
      }
    } catch (err) {
      console.error('Erro ao obter usuário:', err)
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  // Função para trocar nível ativo
  const trocarNivel = async (novoNivel: NivelHierarquico): Promise<boolean> => {
    try {
      const response = await fetch('/api/usuario/me', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ novoNivel })
      })

      const data = await response.json()

      if (data.success) {
        // Atualizar usuário local
        if (usuario) {
          setUsuario({
            ...usuario,
            nivelAtivo: novoNivel
          })
        }
        return true
      } else {
        setError(data.error || 'Erro ao trocar nível')
        return false
      }
    } catch (err) {
      console.error('Erro ao trocar nível:', err)
      setError('Erro de conexão ao trocar nível')
      return false
    }
  }

  // Função para verificar permissão
  const temPermissaoFunc = (permissao: keyof typeof PERMISSOES_SISTEMA.administrador.permissoes): boolean => {
    if (!usuario || usuario.status !== 'ativo') {
      return false
    }

    const permissoesNivel = PERMISSOES_SISTEMA[usuario.nivelAtivo]
    return permissoesNivel.permissoes[permissao]
  }

  // Função para verificar nível
  const temNivelFunc = (nivel: NivelHierarquico): boolean => {
    if (!usuario || usuario.status !== 'ativo') {
      return false
    }

    return usuario.niveisHierarquicos.includes(nivel)
  }

  // Effect principal
  useEffect(() => {
    if (status === 'loading') {
      setIsLoading(true)
      return
    }

    if (status === 'unauthenticated') {
      setUsuario(null)
      setIsLoading(false)
      return
    }

    if (status === 'authenticated' && session?.user?.email) {
      obterUsuario()
    }
  }, [status, session])

  // Estados derivados
  const isPendente = usuario?.status === 'pendente'
  const isInativo = usuario?.status === 'inativo'
  const isAtivo = usuario?.status === 'ativo'

  return {
    usuario,
    isLoading,
    error,
    temPermissao: temPermissaoFunc,
    temNivel: temNivelFunc,
    trocarNivel,
    sincronizar,
    isPendente,
    isInativo,
    isAtivo,
  }
}