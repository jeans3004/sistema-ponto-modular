'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import PublicHeader from '@/components/ui/PublicHeader'
import { 
  FaGoogle, 
  FaMapMarkerAlt, 
  FaShieldAlt, 
  FaChartLine, 
  FaUsers, 
  FaClock, 
  FaCheckCircle,
  FaStar,
  FaArrowRight,
  FaPlay
} from 'react-icons/fa'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.push('/dashboard')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto"></div>
          <p className="mt-4 text-white">Carregando...</p>
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
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Coluna Esquerda - Conteúdo */}
          <div className="space-y-8">
            <div>
              <h2 className="text-5xl font-bold text-white leading-tight mb-6">
                Controle de Ponto
                <span className="block text-blue-300">Inteligente</span>
              </h2>
              <p className="text-xl text-blue-100 leading-relaxed">
                Sistema profissional de controle de ponto para professores com 
                validação por localização GPS, verificação facial e integração 
                completa com Google Sheets.
              </p>
            </div>

            {/* Características principais */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <FaGoogle className="text-2xl text-blue-300 mb-2" />
                <h3 className="font-semibold text-white mb-1">Login Seguro</h3>
                <p className="text-blue-200 text-sm">Autenticação via Google OAuth</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <FaMapMarkerAlt className="text-2xl text-green-300 mb-2" />
                <h3 className="font-semibold text-white mb-1">GPS Integrado</h3>
                <p className="text-blue-200 text-sm">Validação por localização</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <FaShieldAlt className="text-2xl text-purple-300 mb-2" />
                <h3 className="font-semibold text-white mb-1">Verificação Facial</h3>
                <p className="text-blue-200 text-sm">Dupla autenticação biométrica</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <FaChartLine className="text-2xl text-yellow-300 mb-2" />
                <h3 className="font-semibold text-white mb-1">Relatórios</h3>
                <p className="text-blue-200 text-sm">Análises detalhadas</p>
              </div>
            </div>

            {/* Botão de ação principal */}
            <div className="pt-4">
              <Link
                href="/login"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-900 rounded-xl font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-2xl"
              >
                <FaGoogle className="mr-3 text-xl" />
                Entrar com Google
                <FaArrowRight className="ml-3" />
              </Link>
              
              <p className="text-blue-200 text-sm mt-4">
                Faça login com sua conta Google institucional para registrar seu ponto
              </p>
            </div>
          </div>

          {/* Coluna Direita - Card de Demonstração */}
          <div className="relative">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                  <FaClock className="text-white text-2xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Registro de Ponto
                </h3>
                <p className="text-gray-600">
                  Interface simples e intuitiva para professores
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center mb-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">JP</span>
                    </div>
                    <div className="ml-3">
                      <p className="font-medium text-gray-900">João Professor</p>
                      <p className="text-sm text-gray-600">professor@christmaster.com</p>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <div className="text-3xl font-bold text-gray-900 mb-2">
                      {new Date().toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </div>
                    <p className="text-sm text-gray-600 mb-4">
                      Status: Aguardando registro
                    </p>
                    
                    <button className="w-full bg-green-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center">
                      <FaPlay className="mr-2" />
                      Registrar Entrada
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <FaCheckCircle className="text-green-600 mx-auto mb-2" />
                    <p className="text-xs text-green-700 font-medium">GPS Ativo</p>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <FaShieldAlt className="text-blue-600 mx-auto mb-2" />
                    <p className="text-xs text-blue-700 font-medium">Verificado</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -top-4 -right-4 bg-green-500 text-white rounded-full p-3 shadow-lg">
              <FaUsers className="text-lg" />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-purple-500 text-white rounded-full p-3 shadow-lg">
              <FaStar className="text-lg" />
            </div>
          </div>
        </div>
      </main>

      {/* Seção de Benefícios */}
      <section className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">
              Por que escolher nosso sistema?
            </h3>
            <p className="text-blue-200 text-lg max-w-2xl mx-auto">
              Desenvolvido especificamente para instituições educacionais, 
              com foco na praticidade e segurança.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-4">
                <FaShieldAlt className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Segurança Total
              </h4>
              <p className="text-blue-200">
                Dupla verificação com GPS e reconhecimento facial para 
                máxima segurança nos registros.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-600 rounded-full mb-4">
                <FaChartLine className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Relatórios Inteligentes
              </h4>
              <p className="text-blue-200">
                Análises detalhadas de frequência, horas trabalhadas e 
                relatórios personalizados para gestão.
              </p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-600 rounded-full mb-4">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h4 className="text-xl font-semibold text-white mb-2">
                Fácil Integração
              </h4>
              <p className="text-blue-200">
                Integração completa com Google Workspace e sincronização 
                automática com planilhas institucionais.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-white/5 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-blue-200">
                © 2025 Centro de Educação Integral Christ Master
              </p>
              <p className="text-blue-300 text-sm">
                Sistema de Controle de Pontos - Todos os direitos reservados
              </p>
            </div>
            <div className="flex space-x-6">
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                Privacidade
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                Termos
              </a>
              <a href="#" className="text-blue-200 hover:text-white transition-colors">
                Suporte
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
