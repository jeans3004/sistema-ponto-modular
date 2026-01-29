'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaUsers, 
  FaClock, 
  FaCalendarCheck, 
  FaChartLine,
  FaHistory,
  FaFilter,
  FaDownload,
  FaUserCircle,
  FaSpinner,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimesCircle,
  FaEye
} from 'react-icons/fa'

interface Funcionario {
  email: string
  nome: string
  foto?: string
  configuracoes?: any
}

interface Estatisticas {
  totalDias: number
  diasCompletos: number
  horasTrabalhadas: number
  ultimoRegistro: string | null
}

interface PontoRecente {
  data: string
  horaEntrada?: string
  horaSaida?: string
  inicioAlmoco?: string
  fimAlmoco?: string
}

interface HistoricoItem {
  funcionario: Funcionario
  estatisticas: Estatisticas
  pontosRecentes: PontoRecente[]
  erro?: string
}

interface EstatisticasGerais {
  totalFuncionarios: number
  totalRegistros: number
  horasTrabalhadasTotal: number
  funcionariosAtivos: number
}

export default function HistoricoGeralPage() {
  const { data: session } = useSession()
  const { usuario, temNivel } = useUsuario()
  const router = useRouter()

  const [historico, setHistorico] = useState<HistoricoItem[]>([])
  const [estatisticasGerais, setEstatisticasGerais] = useState<EstatisticasGerais | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filtros, setFiltros] = useState({
    dataInicio: '',
    dataFim: '',
    limite: 100
  })
  const [isClientSide, setIsClientSide] = useState(false)
  const isLoadingRef = useRef(false)

  // Marcar como client-side para evitar hidratação
  useEffect(() => {
    setIsClientSide(true)
  }, [])

  // Verificar permissões
  useEffect(() => {
    if (!session) {
      router.push('/login')
      return
    }

    if (usuario && !temNivel('administrador') && !temNivel('coordenador')) {
      router.push('/dashboard')
      return
    }
  }, [session, usuario, temNivel, router])

  const carregarHistoricoGeral = useCallback(async () => {
    // Evitar múltiplas chamadas simultâneas
    if (isLoadingRef.current) return
    
    try {
      isLoadingRef.current = true
      setIsLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filtros.dataInicio) params.append('dataInicio', filtros.dataInicio)
      if (filtros.dataFim) params.append('dataFim', filtros.dataFim)
      params.append('limite', filtros.limite.toString())

      const response = await fetch(`/api/admin/historico-geral?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao carregar histórico geral')
      }

      setHistorico(data.historico)
      setEstatisticasGerais(data.estatisticas)
    } catch (error) {
      console.error('Erro ao carregar histórico geral:', error)
      setError(error instanceof Error ? error.message : 'Erro desconhecido')
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, [filtros])

  // Carregar dados apenas uma vez quando componente monta e usuário é válido
  useEffect(() => {
    if (usuario && usuario.niveisHierarquicos && 
        (usuario.niveisHierarquicos.includes('administrador') || 
         usuario.niveisHierarquicos.includes('coordenador'))) {
      carregarHistoricoGeral()
    }
  }, [usuario?.email]) // Só recarregar se o usuário mudar

  // Recarregar quando filtros mudarem
  useEffect(() => {
    if (usuario && usuario.niveisHierarquicos && 
        (usuario.niveisHierarquicos.includes('administrador') || 
         usuario.niveisHierarquicos.includes('coordenador'))) {
      carregarHistoricoGeral()
    }
  }, [filtros.dataInicio, filtros.dataFim])

  const formatarData = (data: string) => {
    return new Date(data).toLocaleDateString('pt-BR')
  }

  const formatarHorario = (horario?: string) => {
    return horario || '--:--'
  }

  const calcularStatusDia = (ponto: PontoRecente) => {
    if (ponto.horaEntrada && ponto.horaSaida) {
      return { status: 'completo', cor: 'text-green-600', icone: FaCheckCircle }
    }
    if (ponto.horaEntrada) {
      return { status: 'em_andamento', cor: 'text-yellow-600', icone: FaClock }
    }
    return { status: 'incompleto', cor: 'text-red-600', icone: FaTimesCircle }
  }

  const obterStatusFuncionario = (ultimoRegistro: string | null) => {
    if (!ultimoRegistro) return { texto: 'Sem registros', cor: 'text-gray-500' }
    
    // Só calcular no cliente para evitar hidratação
    if (!isClientSide) return { texto: 'Verificando...', cor: 'text-gray-500' }
    
    const agora = new Date()
    const dataUltimoRegistro = new Date(ultimoRegistro)
    const diferencaDias = (agora.getTime() - dataUltimoRegistro.getTime()) / (1000 * 60 * 60 * 24)
    
    if (diferencaDias <= 1) return { texto: 'Ativo hoje', cor: 'text-green-600' }
    if (diferencaDias <= 7) return { texto: 'Ativo esta semana', cor: 'text-blue-600' }
    if (diferencaDias <= 30) return { texto: 'Ativo este mês', cor: 'text-yellow-600' }
    return { texto: 'Inativo', cor: 'text-red-600' }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Carregando histórico geral...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <FaExclamationTriangle className="text-4xl text-red-600 mx-auto mb-4" />
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={carregarHistoricoGeral}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Cabeçalho */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <FaHistory className="mr-3 text-blue-600" />
                Histórico Geral
              </h1>
              <p className="text-gray-600 mt-2">
                Visão resumida dos registros de ponto de todos os funcionários
              </p>
            </div>
            
            <div className="flex space-x-4">
              <button className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                <FaDownload className="mr-2" />
                Exportar
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        {estatisticasGerais && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total de Funcionários</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticasGerais.totalFuncionarios}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaCheckCircle className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Funcionários Ativos</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticasGerais.funcionariosAtivos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <FaCalendarCheck className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Total de Registros</p>
                  <p className="text-2xl font-bold text-gray-900">{estatisticasGerais.totalRegistros}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {Math.round(estatisticasGerais.horasTrabalhadasTotal)}h
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Lista de Funcionários */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">Funcionários e Registros</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {historico.map((item, index) => {
              const statusFuncionario = obterStatusFuncionario(item.estatisticas.ultimoRegistro)
              
              return (
                <div key={item.funcionario.email} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    {/* Informações do Funcionário */}
                    <div className="flex items-center space-x-4">
                      <div className="relative">
                        {item.funcionario.foto ? (
                          <img
                            src={item.funcionario.foto}
                            alt={item.funcionario.nome}
                            className="w-12 h-12 rounded-full"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                            <FaUserCircle className="text-gray-400 text-2xl" />
                          </div>
                        )}
                        <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                          statusFuncionario.cor.includes('green') ? 'bg-green-500' :
                          statusFuncionario.cor.includes('blue') ? 'bg-blue-500' :
                          statusFuncionario.cor.includes('yellow') ? 'bg-yellow-500' : 'bg-gray-400'
                        }`} />
                      </div>
                      
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {item.funcionario.nome}
                        </h3>
                        <p className="text-sm text-gray-600">{item.funcionario.email}</p>
                        <p className={`text-sm font-medium ${statusFuncionario.cor}`}>
                          {statusFuncionario.texto}
                        </p>
                      </div>
                    </div>

                    {/* Estatísticas */}
                    <div className="grid grid-cols-3 gap-6 text-center">
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{item.estatisticas.totalDias}</p>
                        <p className="text-sm text-gray-600">Dias Total</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-600">{item.estatisticas.diasCompletos}</p>
                        <p className="text-sm text-gray-600">Dias Completos</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-blue-600">
                          {Math.round(item.estatisticas.horasTrabalhadas)}h
                        </p>
                        <p className="text-sm text-gray-600">Horas Trabalhadas</p>
                      </div>
                    </div>

                    {/* Ações */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/historico?funcionario=${item.funcionario.email}`)}
                        className="flex items-center px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
                        title="Ver histórico completo"
                      >
                        <FaEye className="mr-1" />
                        Ver Completo
                      </button>
                    </div>
                  </div>

                  {/* Registros Recentes */}
                  {item.pontosRecentes.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-700 mb-2">Registros Recentes</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {item.pontosRecentes.slice(0, 3).map((ponto, pontoIndex) => {
                          const statusDia = calcularStatusDia(ponto)
                          const StatusIcon = statusDia.icone
                          
                          return (
                            <div key={pontoIndex} className="bg-gray-50 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm font-medium text-gray-900">
                                  {formatarData(ponto.data)}
                                </span>
                                <StatusIcon className={`text-sm ${statusDia.cor}`} />
                              </div>
                              <div className="text-xs text-gray-600 space-y-1">
                                <div className="flex justify-between">
                                  <span>Entrada:</span>
                                  <span>{formatarHorario(ponto.horaEntrada)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Saída:</span>
                                  <span>{formatarHorario(ponto.horaSaida)}</span>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {item.erro && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600">{item.erro}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {historico.length === 0 && (
            <div className="p-12 text-center">
              <FaUsers className="text-4xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Nenhum funcionário encontrado</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}