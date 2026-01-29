'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { FaUserShield, FaSpinner, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa'

export default function AdminSetupPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSetup = async () => {
    setIsLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/admin/setup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        // Redirecionar para dashboard após 3 segundos
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else {
        setError(data.error || 'Erro no setup')
      }
    } catch (err) {
      console.error('Erro no setup:', err)
      setError('Erro de conexão')
    } finally {
      setIsLoading(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="animate-spin text-white text-4xl mx-auto mb-4" />
          <p className="text-white text-lg">Carregando...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    router.push('/login')
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
        <div className="text-center">
          {/* Ícone */}
          <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <FaUserShield className="text-white text-3xl" />
          </div>

          {/* Título */}
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Setup de Administrador
          </h1>

          {/* Mensagem inicial */}
          {!result && !error && !isLoading && (
            <>
              <p className="text-gray-600 mb-6">
                Configure seu usuário como administrador do sistema ou sincronize com as configurações existentes.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Usuário atual:</strong> {session?.user?.name}<br />
                  <strong>Email:</strong> {session?.user?.email}
                </p>
              </div>
            </>
          )}

          {/* Loading */}
          {isLoading && (
            <div className="mb-6">
              <FaSpinner className="animate-spin text-blue-600 text-3xl mx-auto mb-4" />
              <p className="text-gray-600">Configurando sistema...</p>
            </div>
          )}

          {/* Resultado Sucesso */}
          {result && (
            <div className="mb-6">
              <FaCheckCircle className="text-green-600 text-3xl mx-auto mb-4" />
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-green-800 font-medium mb-2">
                  {result.message}
                </p>
                <div className="text-sm text-green-700">
                  <p><strong>Status:</strong> {result.usuario?.status}</p>
                  <p><strong>Níveis:</strong> {result.usuario?.niveisHierarquicos?.join(', ')}</p>
                  <p><strong>Nível Ativo:</strong> {result.usuario?.nivelAtivo}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Redirecionando para o dashboard em 3 segundos...
              </p>
            </div>
          )}

          {/* Erro */}
          {error && (
            <div className="mb-6">
              <FaExclamationTriangle className="text-red-600 text-3xl mx-auto mb-4" />
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          {/* Botões */}
          {!result && (
            <div className="space-y-3">
              <button
                onClick={handleSetup}
                disabled={isLoading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                {isLoading ? 'Configurando...' : 'Executar Setup'}
              </button>
              
              <button
                onClick={() => router.push('/dashboard')}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Voltar ao Dashboard
              </button>
            </div>
          )}

          {/* Informações adicionais */}
          <div className="mt-6 text-xs text-gray-500 bg-gray-50 rounded-lg p-3">
            <p className="font-medium mb-1">ℹ️ Como funciona:</p>
            <ul className="text-left space-y-1">
              <li>• Se você for o primeiro usuário: vira administrador</li>
              <li>• Se já existem admins: apenas sincroniza seus dados</li>
              <li>• Admins podem promover outros usuários depois</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}