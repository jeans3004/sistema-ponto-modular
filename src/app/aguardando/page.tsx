'use client'

import { useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useUsuario } from '@/hooks/useUsuario'
import { FaClock, FaSignOutAlt, FaSyncAlt, FaSpinner } from 'react-icons/fa'

export default function AguardandoAprovacao() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading, isAtivo, sincronizar } = useUsuario()

  // Redirecionar para login se não autenticado
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Se autenticado mas sem usuario no banco, tentar sincronizar para criar o registro
  useEffect(() => {
    if (status === 'authenticated' && !isLoading && !usuario) {
      sincronizar()
    }
  }, [status, isLoading, usuario])

  // Redirecionar para dashboard se já está ativo
  useEffect(() => {
    if (!isLoading && isAtivo) {
      router.push('/dashboard')
    }
  }, [isLoading, isAtivo, router])

  const handleVerificarNovamente = async () => {
    await sincronizar()
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20 text-center">
        {/* Ícone */}
        <div className="inline-flex items-center justify-center w-24 h-24 bg-yellow-100 rounded-full mb-6">
          <FaClock className="text-yellow-600 text-4xl" />
        </div>

        {/* Saudação */}
        {session?.user?.name && (
          <h2 className="text-xl font-semibold text-gray-700 mb-2">
            Olá, {session.user.name.split(' ')[0]}!
          </h2>
        )}

        {/* Mensagem principal */}
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Aguardando Aprovação
        </h1>

        <p className="text-gray-600 mb-8">
          Sua conta está aguardando aprovação do administrador.
          Você será notificado quando sua conta for ativada.
        </p>

        {/* Status atual */}
        {usuario && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
              <span className="text-yellow-800 font-medium">
                Status: {usuario.status === 'pendente' ? 'Pendente' : 'Inativo'}
              </span>
            </div>
            {usuario.email && (
              <p className="text-yellow-700 text-sm mt-2">{usuario.email}</p>
            )}
          </div>
        )}

        {/* Botões */}
        <div className="space-y-3">
          <button
            onClick={handleVerificarNovamente}
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <FaSpinner className="animate-spin" />
                <span>Verificando...</span>
              </>
            ) : (
              <>
                <FaSyncAlt />
                <span>Verificar novamente</span>
              </>
            )}
          </button>

          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
          >
            <FaSignOutAlt />
            <span>Sair</span>
          </button>
        </div>

        <p className="text-xs text-gray-500 mt-6">
          Se precisar de ajuda, entre em contato com o administrador do sistema.
        </p>
      </div>
    </div>
  )
}
