'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/dashboard/Header'
import DevelopmentModal from '@/components/ui/DevelopmentModal'
import { formatDate } from '@/lib/utils'
import { 
  FaCalendarAlt, 
  FaSearch, 
  FaDownload, 
  FaClock, 
  FaFilter,
  FaPlay,
  FaStop,
  FaChartLine,
  FaFileExport,
  FaUser,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner
} from 'react-icons/fa'

interface HistoricoRecord {
  id: string
  funcionarioEmail: string
  data: string
  horaEntrada?: string
  horaSaida?: string
  totalHoras: string
}

export default function HistoricoPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  // Estados principais para dados e interface
  const [registros, setRegistros] = useState<HistoricoRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth())
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Estados para controle dos modais de desenvolvimento
  // Estes estados controlam quando cada modal específico deve aparecer
  const [showExportModal, setShowExportModal] = useState(false)
  const [showPdfModal, setShowPdfModal] = useState(false)
  const [showExcelModal, setShowExcelModal] = useState(false)
  const [showChartsModal, setShowChartsModal] = useState(false)

  // Atualizar relógio em tempo real
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session) {
      loadHistorico()
    }
  }, [status, session, router])

  const loadHistorico = async () => {
    try {
      const response = await fetch('/api/pontos/historico')
      const data = await response.json()
      
      if (data.pontos) {
        setRegistros(data.pontos)
      }
    } catch (error) {
      console.error('Erro ao carregar histórico:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
  }

  // Filtrar registros por mês e ano selecionados
  const registrosFiltrados = registros.filter(registro => {
    const dataRegistro = new Date(registro.data)
    return dataRegistro.getMonth() === filtroMes && 
           dataRegistro.getFullYear() === filtroAno
  }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime())

  // Calcular estatísticas baseadas nos dados filtrados
  const totalHorasNoMes = registrosFiltrados.reduce((total, registro) => {
    if (registro.totalHoras) {
      const [horas, minutos] = registro.totalHoras.split('h ').map(h => parseInt(h.replace('m', '')))
      return total + (horas || 0) + ((minutos || 0) / 60)
    }
    return total
  }, 0)

  const diasTrabalhados = registrosFiltrados.filter(r => r.horaEntrada).length
  const mediaHorasPorDia = diasTrabalhados > 0 ? totalHorasNoMes / diasTrabalhados : 0

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando histórico...</p>
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
                  Histórico de Pontos
                </h1>
                <p className="text-blue-200 text-lg">
                  Visualize e analise seus registros de ponto
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
        
        {/* Filtros */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <FaFilter className="text-blue-600 mr-3 text-xl" />
                <h2 className="text-xl font-bold text-gray-900">Filtros</h2>
              </div>
              {/* Botão de exportação atualizado para abrir modal */}
              <button 
                onClick={() => setShowExportModal(true)}
                className="flex items-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                <FaFileExport className="mr-2" />
                Exportar
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Mês</label>
                <select 
                  value={filtroMes}
                  onChange={(e) => setFiltroMes(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  {Array.from({length: 12}, (_, i) => (
                    <option key={i} value={i} className="text-gray-900 font-medium">
                      {new Date(0, i).toLocaleDateString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Ano</label>
                <select 
                  value={filtroAno}
                  onChange={(e) => setFiltroAno(parseInt(e.target.value))}
                  className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white"
                >
                  {Array.from({length: 5}, (_, i) => (
                    <option key={i} value={new Date().getFullYear() - i} className="text-gray-900 font-medium">
                      {new Date().getFullYear() - i}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-900">Buscar</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Buscar por data..."
                    className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 pl-10 text-gray-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 bg-white placeholder-gray-500"
                  />
                  <FaSearch className="absolute left-3 top-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-full">
                <FaClock className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Total de Horas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(totalHorasNoMes)}h {Math.round((totalHorasNoMes % 1) * 60)}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-full">
                <FaCalendarAlt className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Dias Trabalhados</p>
                <p className="text-2xl font-bold text-gray-900">{diasTrabalhados}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-purple-100 rounded-full">
                <FaChartLine className="text-purple-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Média por Dia</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Math.floor(mediaHorasPorDia)}h {Math.round((mediaHorasPorDia % 1) * 60)}m
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-full">
                <FaUser className="text-orange-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600 font-medium">Período</p>
                <p className="text-lg font-bold text-gray-900">
                  {new Date(0, filtroMes).toLocaleDateString('pt-BR', { month: 'short' })} {filtroAno}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de Registros */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden border border-white/20">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-blue-900">
                Registros de {new Date(0, filtroMes).toLocaleDateString('pt-BR', { month: 'long' })} {filtroAno}
              </h3>
              <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                {registrosFiltrados.length} registros
              </span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Entrada
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Saída
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-900 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {registrosFiltrados.map((registro, index) => (
                  <tr key={registro.id} className={`hover:bg-gray-50 transition-colors duration-200 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendarAlt className="text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(new Date(registro.data))}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaPlay className="text-green-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {registro.horaEntrada || '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaStop className="text-red-500 mr-2" />
                        <span className="text-sm font-medium text-gray-900">
                          {registro.horaSaida || '--:--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaClock className="text-blue-500 mr-2" />
                        <span className="text-sm font-bold text-gray-900">
                          {registro.totalHoras || '--'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        registro.horaSaida 
                          ? 'bg-green-100 text-green-800' 
                          : registro.horaEntrada 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                      }`}>
                        {registro.horaSaida ? (
                          <FaCheckCircle className="mr-1" />
                        ) : registro.horaEntrada ? (
                          <FaSpinner className="mr-1" />
                        ) : (
                          <FaTimesCircle className="mr-1" />
                        )}
                        {registro.horaSaida 
                          ? 'Completo' 
                          : registro.horaEntrada 
                            ? 'Em andamento'
                            : 'Não registrado'
                        }
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {registrosFiltrados.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <FaSearch className="text-gray-300 text-4xl mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum registro encontrado
                </h3>
                <p className="text-gray-500">
                  Não há registros de ponto para o período selecionado.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Resumo e Insights */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Resumo do Período
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-blue-50 rounded-lg">
                <span className="text-blue-700 font-medium">Total de registros:</span>
                <span className="text-blue-900 font-bold">{registrosFiltrados.length}</span>
              </div>
              <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg">
                <span className="text-green-700 font-medium">Dias completos:</span>
                <span className="text-green-900 font-bold">
                  {registrosFiltrados.filter(r => r.horaSaida).length}
                </span>
              </div>
              <div className="flex justify-between items-center p-4 bg-yellow-50 rounded-lg">
                <span className="text-yellow-700 font-medium">Em andamento:</span>
                <span className="text-yellow-900 font-bold">
                  {registrosFiltrados.filter(r => r.horaEntrada && !r.horaSaida).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Ações Disponíveis
            </h3>
            <div className="space-y-3">
              {/* Botões atualizados para abrir modais específicos */}
              <button 
                onClick={() => setShowPdfModal(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-200 transform hover:scale-105"
              >
                <FaDownload className="mr-2" />
                Baixar Relatório PDF
              </button>
              <button 
                onClick={() => setShowExcelModal(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 transform hover:scale-105"
              >
                <FaFileExport className="mr-2" />
                Exportar para Excel
              </button>
              <button 
                onClick={() => setShowChartsModal(true)}
                className="w-full flex items-center justify-center px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                <FaChartLine className="mr-2" />
                Gerar Gráficos
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Modais de desenvolvimento - cada um com sua própria finalidade */}
      <DevelopmentModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        featureName="Exportar Dados"
        description="Funcionalidade de exportação de dados em vários formatos está sendo desenvolvida."
      />
      <DevelopmentModal
        isOpen={showPdfModal}
        onClose={() => setShowPdfModal(false)}
        featureName="Relatório PDF"
        description="Geração automática de relatórios em PDF com análises detalhadas e gráficos."
      />
      <DevelopmentModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        featureName="Exportar para Excel"
        description="Exportação de dados para planilhas Excel com formatação profissional."
      />
      <DevelopmentModal
        isOpen={showChartsModal}
        onClose={() => setShowChartsModal(false)}
        featureName="Gerar Gráficos"
        description="Gráficos interativos com análises visuais de produtividade e tendências."
      />
    </div>
  )
}