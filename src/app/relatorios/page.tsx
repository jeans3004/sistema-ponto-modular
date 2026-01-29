'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/dashboard/Header'
import { formatDate } from '@/lib/utils'
import { 
  FaChartLine, 
  FaTools, 
  FaCog, 
  FaCode, 
  FaRocket,
  FaCalendarAlt,
  FaUsers,
  FaFileAlt,
  FaSpinner
} from 'react-icons/fa'

export default function RelatoriosPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentTime, setCurrentTime] = useState(new Date())

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent"></div>
      </div>

      <Header />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  Relatórios e Análises
                </h1>
                <p className="text-blue-200 text-lg">
                  Funcionalidade em desenvolvimento
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </div>
                <div className="text-blue-200 text-sm">
                  {formatDate(new Date())}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Card Principal - Em Desenvolvimento */}
        <div className="mb-8">
          <div className="bg-white rounded-3xl shadow-2xl p-12 border border-gray-200">
            <div className="text-center max-w-4xl mx-auto">
              {/* Ícone Principal */}
              <div className="relative mb-8">
                <div className="inline-flex items-center justify-center w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-2xl">
                  <FaChartLine className="text-white text-5xl" />
                </div>
                <div className="absolute -top-2 -right-2 bg-yellow-400 rounded-full p-3 shadow-lg animate-bounce">
                  <FaTools className="text-yellow-800 text-xl" />
                </div>
              </div>

              {/* Título Principal */}
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                Relatórios em Desenvolvimento
              </h2>
              
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Estamos trabalhando para trazer relatórios avançados e análises detalhadas 
                para seu controle de pontos. Em breve você terá acesso a insights poderosos 
                sobre produtividade e frequência.
              </p>

              {/* Recursos Planejados */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
                  <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaChartLine className="text-white text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-blue-900 mb-2">
                    Gráficos Avançados
                  </h3>
                  <p className="text-blue-700 text-sm">
                    Visualizações interativas de horas trabalhadas, tendências e padrões
                  </p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaCalendarAlt className="text-white text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-green-900 mb-2">
                    Relatórios Mensais
                  </h3>
                  <p className="text-green-700 text-sm">
                    Resumos automáticos com análises de produtividade e frequência
                  </p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6 border border-purple-200">
                  <div className="w-16 h-16 bg-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FaFileAlt className="text-white text-2xl" />
                  </div>
                  <h3 className="text-lg font-bold text-purple-900 mb-2">
                    Exportação PDF
                  </h3>
                  <p className="text-purple-700 text-sm">
                    Relatórios profissionais prontos para impressão e compartilhamento
                  </p>
                </div>
              </div>

              {/* Status de Desenvolvimento */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-8 border border-yellow-200 mb-8">
                <div className="flex items-center justify-center mb-4">
                  <div className="flex items-center space-x-2">
                    <FaSpinner className="text-yellow-600 animate-spin text-xl" />
                    <span className="text-yellow-800 font-bold text-lg">Em Construção</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
                  <div className="flex flex-col items-center">
                    <FaCode className="text-yellow-600 text-2xl mb-2" />
                    <span className="text-sm text-yellow-800 font-medium">Codificação</span>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-3/4"></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <FaCog className="text-yellow-600 text-2xl mb-2" />
                    <span className="text-sm text-yellow-800 font-medium">Configuração</span>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-1/2"></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <FaUsers className="text-yellow-600 text-2xl mb-2" />
                    <span className="text-sm text-yellow-800 font-medium">Testes</span>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-1/4"></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center">
                    <FaRocket className="text-yellow-600 text-2xl mb-2" />
                    <span className="text-sm text-yellow-800 font-medium">Lançamento</span>
                    <div className="w-full bg-yellow-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-0"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Botão de Notificação */}
              <button className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg">
                <FaRocket className="mr-2" />
                Receber Notificação Quando Lançar
              </button>
            </div>
          </div>
        </div>

        {/* Informações Adicionais */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Previsão de Lançamento
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="w-4 h-4 bg-green-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Versão Beta: Próximas 2 semanas</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Versão Completa: 1 mês</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-blue-500 rounded-full mr-3"></div>
                <span className="text-gray-700">Recursos Avançados: 2 meses</span>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Enquanto Isso...
            </h3>
            <div className="space-y-3">
              <p className="text-gray-700">
                Continue usando o sistema de controle de pontos normalmente. 
                Todos os seus dados estão sendo coletados e estarão disponíveis 
                nos relatórios assim que a funcionalidade for lançada.
              </p>
              <div className="bg-blue-50 rounded-lg p-4">
                <p className="text-blue-800 font-medium">
                  💡 Seus dados históricos serão automaticamente incluídos nos relatórios!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
