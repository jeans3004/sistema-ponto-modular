'use client'

import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import PublicHeader from '@/components/ui/PublicHeader'
import { 
  FaGoogle, 
  FaSpinner, 
  FaShieldAlt, 
  FaUsers, 
  FaCheckCircle,
  FaArrowRight,
  FaMapMarkerAlt
} from 'react-icons/fa'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckingSession, setIsCheckingSession] = useState(true)
  const router = useRouter()

  useEffect(() => {
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/dashboard')
      } else {
        setIsCheckingSession(false)
      }
    }
    
    checkSession()
  }, [router])

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    await signIn('google', { callbackUrl: '/dashboard' })
  }

  if (isCheckingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <FaSpinner className="animate-spin text-white text-2xl mx-auto mb-4" />
            <p className="text-white text-lg">Verificando autenticação...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent"></div>
      </div>

      {/* Header Branco */}
      <PublicHeader />

      {/* Conteúdo Principal */}
      <main className="relative z-10 flex items-center justify-center min-h-[calc(100vh-80px)] px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Coluna Esquerda - Informações */}
            <div className="text-center lg:text-left space-y-8">
              <div>
                <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                  Bem-vindo ao
                  <span className="block text-blue-300">Sistema de Pontos</span>
                </h2>
                <p className="text-xl text-blue-100 leading-relaxed">
                  Faça login com sua conta Google institucional para acessar 
                  o sistema de controle de pontos mais moderno e seguro.
                </p>
              </div>

              {/* Recursos de segurança */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <FaShieldAlt className="text-2xl text-green-300 mb-2" />
                  <h3 className="font-semibold text-white mb-1">Segurança Total</h3>
                  <p className="text-blue-200 text-sm">OAuth 2.0 e criptografia</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                  <FaMapMarkerAlt className="text-2xl text-purple-300 mb-2" />
                  <h3 className="font-semibold text-white mb-1">GPS Integrado</h3>
                  <p className="text-blue-200 text-sm">Validação por localização</p>
                </div>
              </div>

              {/* Estatísticas */}
              <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Sistema Confiável
                </h3>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-300">99.9%</div>
                    <div className="text-xs text-blue-200">Disponibilidade</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-300">100+</div>
                    <div className="text-xs text-blue-200">Usuários</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-300">24/7</div>
                    <div className="text-xs text-blue-200">Suporte</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita - Formulário de Login */}
            <div className="relative">
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
                {/* Cabeçalho do formulário */}
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                    <FaUsers className="text-white text-2xl" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Acesso ao Sistema
                  </h3>
                  <p className="text-gray-600">
                    Entre com sua conta Google institucional
                  </p>
                </div>

                {/* Botão de login */}
                <div className="space-y-6">
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                    className="w-full flex justify-center items-center px-6 py-4 bg-white border-2 border-gray-200 rounded-xl shadow-sm text-lg font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02]"
                  >
                    {isLoading ? (
                      <FaSpinner className="animate-spin mr-3 text-xl" />
                    ) : (
                      <FaGoogle className="mr-3 text-xl text-red-500" />
                    )}
                    {isLoading ? 'Entrando...' : 'Entrar com Google'}
                    {!isLoading && <FaArrowRight className="ml-3 text-blue-600" />}
                  </button>

                  {/* Divider */}
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-4 bg-white text-gray-500">
                        Acesso seguro e confiável
                      </span>
                    </div>
                  </div>

                  {/* Informações de segurança */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center mb-3">
                      <FaShieldAlt className="text-blue-600 mr-2" />
                      <h4 className="font-semibold text-blue-900">
                        Seus dados estão protegidos
                      </h4>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                        Autenticação via Google OAuth 2.0
                      </li>
                      <li className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                        Criptografia de ponta a ponta
                      </li>
                      <li className="flex items-center">
                        <FaCheckCircle className="text-green-500 mr-2 text-xs" />
                        Nenhuma senha armazenada
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Elementos decorativos */}
              <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3 shadow-lg">
                <FaCheckCircle className="text-lg" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-blue-500 text-white rounded-full p-3 shadow-lg">
                <FaShieldAlt className="text-lg" />
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center text-center md:text-left">
            <div className="mb-4 md:mb-0">
              <p className="text-blue-200 text-sm">
                © 2025 Desenvolvido por Jean Machado
              </p>
              <p className="text-blue-300 text-xs">
                Sistema de Controle de Pontos - Acesso Seguro
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-blue-200 text-sm">
                <FaShieldAlt className="mr-2" />
                <span>Conexão Segura</span>
              </div>
              <div className="flex items-center text-blue-200 text-sm">
                <FaCheckCircle className="mr-2 text-green-300" />
                <span>Sistema Ativo</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
