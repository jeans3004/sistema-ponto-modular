'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/dashboard/Header'
import { formatDate } from '@/lib/utils'
import { SYSTEM_CONFIG } from '@/lib/config'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaUsers, 
  FaSpinner, 
  FaClock, 
  FaCalendarAlt,
  FaChartLine,
  FaHistory,
  FaCheckCircle,
  FaUser,
  FaArrowRight,
  FaEdit,
  FaEye,
  FaSearch,
  FaDownload,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaInfoCircle,
  FaUserCheck,
  FaClipboardList,
  FaBuilding
} from 'react-icons/fa'

interface Funcionario {
  email: string
  nome: string
  foto?: string
  coordenacoes?: { id: string; nome: string }[]
  coordenacaoId?: string
  coordenacaoNome?: string
  tipoColaborador?: 'docente' | 'administrativo'
  configuracoes?: {
    horarioTrabalho?: {
      entrada: string
      saida: string
      inicioAlmoco: string
      fimAlmoco: string
      [dia: string]: any
    }
    tipoHorario?: 'geral' | 'dias'
    definidoPor?: string
    dataDefinicao?: any
  }
}

interface TimeRecord {
  id: string
  funcionarioEmail: string
  funcionarioNome?: string
  data: string
  horaEntrada?: string
  horaSaida?: string
  inicioAlmoco?: string
  fimAlmoco?: string
  tempoAlmoco?: string
  totalHoras: string
}

export default function CoordenadorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  // Estados principais
  const [funcionarios, setFuncionarios] = useState<Funcionario[]>([])
  const [pontosHoje, setPontosHoje] = useState<TimeRecord[]>([])
  const [coordenacoes, setCoordenacoes] = useState<any[]>([])
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Estados para gerenciamento de horários
  const [selectedEmployee, setSelectedEmployee] = useState<Funcionario | null>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [scheduleForm, setScheduleForm] = useState({
    geral: {
      entrada: '08:00',
      saida: '17:00',
      inicioAlmoco: '12:00',
      fimAlmoco: '13:00'
    },
    diasEspecificos: {} as Record<string, { entrada: string; saida: string; inicioAlmoco: string; fimAlmoco: string }>
  })
  const [scheduleType, setScheduleType] = useState<'geral' | 'dias'>('geral')
  const [selectedDaysToAdd, setSelectedDaysToAdd] = useState<string[]>([])
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false)
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'trabalhando' | 'fora' | 'almoco'>('todos')

  // Verificar se o usuário tem acesso a este dashboard
  useEffect(() => {
    if (!isLoadingUser && usuario && !usuario.niveisHierarquicos.includes('coordenador')) {
      router.push('/dashboard')
      return
    }
  }, [usuario, isLoadingUser, router])

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

  useEffect(() => {
    if (session?.user?.email) {
      loadDashboardData()
    }
  }, [session])

  const loadDashboardData = async () => {
    try {
      setIsLoadingData(true)
      
      // Carregar lista de funcionários com horários
      const funcionariosResponse = await fetch('/api/coordenador/horarios')
      const funcionariosData = await funcionariosResponse.json()
      
      if (funcionariosData.success) {
        setFuncionarios(funcionariosData.funcionarios)
        setCoordenacoes(funcionariosData.coordenacoes || [])
      }
      
      // Carregar pontos de hoje de todos os funcionários
      const hoje = new Date().toLocaleDateString('en-CA', { timeZone: SYSTEM_CONFIG.TIMEZONE })
      const pontosResponse = await fetch(`/api/coordenador/pontos?data=${hoje}`)
      const pontosData = await pontosResponse.json()
      
      if (pontosData.success) {
        setPontosHoje(pontosData.pontos)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleDefineSchedule = async (funcionario: Funcionario) => {
    setSelectedEmployee(funcionario)
    
    // Pré-carregar horários existentes se houver
    if (funcionario.configuracoes?.horarioTrabalho) {
      const horarios = funcionario.configuracoes.horarioTrabalho
      const tipo = funcionario.configuracoes.tipoHorario || 'geral'
      
      if (tipo === 'geral') {
        setScheduleForm({
          geral: horarios,
          diasEspecificos: {}
        })
        setScheduleType('geral')
      } else if (tipo === 'dias') {
        // Migrar formato antigo para novo
        setScheduleForm({
          geral: horarios.geral || {
            entrada: '08:00',
            saida: '17:00',
            inicioAlmoco: '12:00',
            fimAlmoco: '13:00'
          },
          diasEspecificos: horarios.diasEspecificos || {}
        })
        setScheduleType('dias')
      } else if (tipo === 'flexivel') {
        setScheduleForm({
          geral: horarios.geral,
          diasEspecificos: horarios.diasEspecificos || {}
        })
        setScheduleType('dias')
      }
    } else {
      // Resetar para valores padrão
      setScheduleForm({
        geral: {
          entrada: '08:00',
          saida: '17:00',
          inicioAlmoco: '12:00',
          fimAlmoco: '13:00'
        },
        diasEspecificos: {}
      })
      setScheduleType('geral')
    }
    
    setSelectedDaysToAdd([])
    setShowScheduleModal(true)
  }

  const handleSubmitSchedule = async () => {
    if (!selectedEmployee) return
    
    setIsSubmittingSchedule(true)
    try {
      // Para o novo sistema flexível, sempre enviamos tanto o geral quanto os dias específicos
      const horarios = scheduleType === 'geral' 
        ? scheduleForm.geral 
        : {
            geral: scheduleForm.geral,
            diasEspecificos: scheduleForm.diasEspecificos
          }
      
      const response = await fetch('/api/coordenador/horarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailFuncionario: selectedEmployee.email,
          horarios: horarios,
          tipoHorario: scheduleType
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Horários definidos com sucesso!')
        setShowScheduleModal(false)
        await loadDashboardData() // Recarregar dados
      } else {
        alert(data.error || 'Erro ao definir horários')
      }
    } catch (error) {
      console.error('Erro ao definir horários:', error)
      alert('Erro ao definir horários')
    } finally {
      setIsSubmittingSchedule(false)
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

  const getEmployeeStatus = (funcionarioEmail: string) => {
    const registro = pontosHoje.find(p => p.funcionarioEmail === funcionarioEmail)
    
    if (!registro || !registro.horaEntrada) return 'fora'
    if (registro.horaSaida) return 'fora'
    if (registro.inicioAlmoco && !registro.fimAlmoco) return 'almoco'
    return 'trabalhando'
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trabalhando': return 'text-green-600'
      case 'almoco': return 'text-orange-600'
      case 'fora': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trabalhando': return 'Trabalhando'
      case 'almoco': return 'No almoço'
      case 'fora': return 'Fora do trabalho'
      default: return 'Fora do trabalho'
    }
  }

  const filteredFuncionarios = funcionarios.filter(funcionario => {
    const matchesSearch = funcionario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         funcionario.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filterStatus === 'todos') return true
    
    const status = getEmployeeStatus(funcionario.email)
    return status === filterStatus
  })

  const statsData = {
    total: funcionarios.length,
    trabalhando: funcionarios.filter(f => getEmployeeStatus(f.email) === 'trabalhando').length,
    almoco: funcionarios.filter(f => getEmployeeStatus(f.email) === 'almoco').length,
    fora: funcionarios.filter(f => getEmployeeStatus(f.email) === 'fora').length
  }

  if (status === 'loading' || isLoadingData || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando dashboard do coordenador...</p>
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
        {/* Cabeçalho do Dashboard */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="flex flex-col md:flex-row justify-between items-center">
              <div className="text-center md:text-left mb-4 md:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2">
                  {getGreeting()}, {session?.user?.name?.split(' ')[0]}!
                </h1>
                <p className="text-blue-200 text-lg">
                  Dashboard do Coordenador • {formatDate(new Date())}
                </p>
                {/* Mostrar coordenações */}
                {usuario?.coordenacoes && usuario.coordenacoes.length > 0 && (
                  <div className="flex items-center mt-2 flex-wrap gap-2">
                    <FaBuilding className="text-blue-300 mr-2" />
                    {usuario.coordenacoes.map((coord) => (
                      <span key={coord.id} className="text-blue-200 font-medium bg-blue-800/30 px-2 py-1 rounded-md text-sm">
                        {coord.nome}
                      </span>
                    ))}
                  </div>
                )} 
                {usuario?.coordenacaoNome && !usuario.coordenacoes?.length && (
                  <div className="flex items-center mt-2">
                    <FaBuilding className="text-blue-300 mr-2" />
                    <span className="text-blue-200 font-medium bg-blue-800/30 px-2 py-1 rounded-md text-sm">{usuario.coordenacaoNome}</span>
                  </div>
                )}
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                  <span className="text-blue-200">Coordenador Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FaUsers className="text-blue-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Total Funcionários</p>
                <p className="text-2xl font-bold text-gray-900">{statsData.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <FaUserCheck className="text-green-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Trabalhando</p>
                <p className="text-2xl font-bold text-green-600">{statsData.trabalhando}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <FaClock className="text-orange-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">No Almoço</p>
                <p className="text-2xl font-bold text-orange-600">{statsData.almoco}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FaTimes className="text-gray-600 text-xl" />
              </div>
              <div className="ml-4">
                <p className="text-gray-500 text-sm">Fora do Trabalho</p>
                <p className="text-2xl font-bold text-gray-600">{statsData.fora}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar funcionário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setFilterStatus('todos')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'todos'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('trabalhando')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'trabalhando'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Trabalhando
              </button>
              <button
                onClick={() => setFilterStatus('almoco')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'almoco'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Almoço
              </button>
              <button
                onClick={() => setFilterStatus('fora')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === 'fora'
                    ? 'bg-gray-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Fora
              </button>
            </div>
          </div>
        </div>

        {/* Lista de Funcionários */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Funcionários</h2>
            <p className="text-gray-600 mt-2">Acompanhe e gerencie os horários da sua equipe</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Funcionário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status Atual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário de Hoje
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Horário Configurado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFuncionarios.map((funcionario) => {
                  const status = getEmployeeStatus(funcionario.email)
                  const registro = pontosHoje.find(p => p.funcionarioEmail === funcionario.email)
                  
                  return (
                    <tr key={funcionario.email} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {funcionario.foto ? (
                            <img
                              src={funcionario.foto}
                              alt={funcionario.nome}
                              className="h-10 w-10 rounded-full mr-3"
                            />
                          ) : (
                            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                              <FaUser className="text-white text-sm" />
                            </div>
                          )}
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {funcionario.nome}
                            </div>
                            <div className="text-sm text-gray-500">
                              {funcionario.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          status === 'trabalhando' ? 'bg-green-100 text-green-800' :
                          status === 'almoco' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getStatusText(status)}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registro ? (
                          <div>
                            <div>Entrada: {registro.horaEntrada || '--:--'}</div>
                            <div>Saída: {registro.horaSaida || '--:--'}</div>
                            <div className="text-xs text-gray-500">
                              Total: {registro.totalHoras || '0h 0m'}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Sem registros hoje</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {funcionario.configuracoes?.horarioTrabalho ? (
                          <div>
                            <div>{funcionario.configuracoes.horarioTrabalho.entrada} - {funcionario.configuracoes.horarioTrabalho.saida}</div>
                            <div className="text-xs text-gray-500">
                              Almoço: {funcionario.configuracoes.horarioTrabalho.inicioAlmoco} - {funcionario.configuracoes.horarioTrabalho.fimAlmoco}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Não configurado</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDefineSchedule(funcionario)}
                            className="inline-flex items-center px-3 py-1 border border-blue-300 text-blue-700 rounded-md hover:bg-blue-50 transition-colors"
                          >
                            <FaEdit className="mr-1" />
                            Horários
                          </button>
                          <button
                            onClick={() => router.push(`/historico?funcionario=${funcionario.email}`)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            title={`Ver histórico de ${funcionario.nome}`}
                          >
                            <FaHistory className="mr-1" />
                            Histórico
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {filteredFuncionarios.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum funcionário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tente uma busca diferente.' :
                 coordenacoes.length === 0 ?
                 'Você não está atribuído como coordenador de nenhuma coordenação.' :
                 'Nenhum funcionário foi atribuído às suas coordenações ou não corresponde aos filtros.'}
              </p>
              {coordenacoes.length === 0 && (
                <div className="mt-4 mx-auto max-w-md p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <FaInfoCircle className="text-yellow-600 mr-2 flex-shrink-0" />
                    <span className="text-yellow-800 text-sm">
                      Peça ao administrador para atribuí-lo como coordenador de uma coordenação na página de Coordenações.
                    </span>
                  </div>
                </div>
              )}
              {coordenacoes.length > 0 && funcionarios.length === 0 && !searchTerm && filterStatus === 'todos' && (
                <div className="mt-4 mx-auto max-w-md p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center">
                    <FaInfoCircle className="text-blue-600 mr-2 flex-shrink-0" />
                    <span className="text-blue-800 text-sm">
                      Nenhum funcionário foi atribuído às suas coordenações. Peça ao administrador para vincular funcionários.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Ações Rápidas do Coordenador */}
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/coordenador/funcionarios')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 border border-indigo-200"
              >
                <FaUsers className="text-indigo-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-indigo-900">Funcionários</p>
                  <p className="text-sm text-indigo-700">Visualizar equipe da coordenação</p>
                </div>
                <FaArrowRight className="text-indigo-600" />
              </button>

              <button
                onClick={() => router.push('/coordenador/ausencias')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-yellow-50 to-yellow-100 rounded-xl hover:from-yellow-100 hover:to-yellow-200 transition-all duration-200 border border-yellow-200"
              >
                <FaCalendarAlt className="text-yellow-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-yellow-900">Ausências</p>
                  <p className="text-sm text-yellow-700">Aprovar e reprovar ausências</p>
                </div>
                <FaArrowRight className="text-yellow-600" />
              </button>

              <button
                onClick={() => router.push('/relatorios')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
              >
                <FaChartLine className="text-blue-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-blue-900">Relatórios da Equipe</p>
                  <p className="text-sm text-blue-700">Análises e estatísticas</p>
                </div>
                <FaArrowRight className="text-blue-600" />
              </button>
              
              <button
                onClick={() => router.push('/historico-geral')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-200 border border-green-200"
              >
                <FaClipboardList className="text-green-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-green-900">Histórico Geral</p>
                  <p className="text-sm text-green-700">Todos os registros</p>
                </div>
                <FaArrowRight className="text-green-600" />
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Resumo do Dia</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Funcionários ativos:</span>
                <span className="font-semibold text-green-600">{statsData.trabalhando}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Em pausa (almoço):</span>
                <span className="font-semibold text-orange-600">{statsData.almoco}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fora do trabalho:</span>
                <span className="font-semibold text-gray-600">{statsData.fora}</span>
              </div>
              <div className="pt-3 border-t border-gray-200">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-medium">Total da equipe:</span>
                  <span className="font-bold text-blue-600">{statsData.total}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <FaBuilding className="text-purple-600 mr-3" />
              Minhas Coordenações
            </h3>
            {coordenacoes.length > 0 ? (
              <div className="space-y-3">
                {coordenacoes.map((coordenacao) => (
                  <div key={coordenacao.id} className="bg-gradient-to-r from-purple-50 to-purple-100 p-4 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-purple-900">{coordenacao.nome}</h4>
                        <p className="text-sm text-purple-700 mt-1">{coordenacao.descricao}</p>
                      </div>
                      <div className="flex items-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <FaCheckCircle className="mr-1" />
                          Ativa
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FaBuilding className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                <p className="text-lg font-medium mb-2">Nenhuma coordenação atribuída</p>
                <p className="text-sm">Entre em contato com o administrador para ser atribuído a uma coordenação.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Definição de Horários */}
      {showScheduleModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaClock className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Definir Horários
              </h2>
              <p className="text-gray-600">
                {selectedEmployee.nome}
              </p>
            </div>

            {/* Selector de tipo de horário */}
            <div className="mb-6">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setScheduleType('geral')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    scheduleType === 'geral'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Horário Geral
                </button>
                <button
                  onClick={() => setScheduleType('dias')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    scheduleType === 'dias'
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Por Dia da Semana
                </button>
              </div>
            </div>

            {scheduleType === 'geral' ? (
              /* Horário Geral */
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Horário para todos os dias</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entrada
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.geral.entrada}
                    onChange={(e) => setScheduleForm({ 
                      ...scheduleForm, 
                      geral: { ...scheduleForm.geral, entrada: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Saída
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.geral.saida}
                    onChange={(e) => setScheduleForm({ 
                      ...scheduleForm, 
                      geral: { ...scheduleForm.geral, saida: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Início Almoço
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.geral.inicioAlmoco}
                    onChange={(e) => setScheduleForm({ 
                      ...scheduleForm, 
                      geral: { ...scheduleForm.geral, inicioAlmoco: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fim Almoço
                  </label>
                  <input
                    type="time"
                    value={scheduleForm.geral.fimAlmoco}
                    onChange={(e) => setScheduleForm({ 
                      ...scheduleForm, 
                      geral: { ...scheduleForm.geral, fimAlmoco: e.target.value }
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                  />
                </div>
              </div>
            </div>
            ) : (
              /* Horários flexíveis por dia da semana */
              <div className="space-y-6">
                {/* Horário Geral como base */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-900 mb-3">Horário Geral (Base)</h3>
                  <p className="text-sm text-blue-700 mb-4">Este será usado como padrão para os dias que não tiverem horário específico definido.</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Entrada</label>
                      <input
                        type="time"
                        value={scheduleForm.geral.entrada}
                        onChange={(e) => setScheduleForm({ 
                          ...scheduleForm, 
                          geral: { ...scheduleForm.geral, entrada: e.target.value }
                        })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Saída</label>
                      <input
                        type="time"
                        value={scheduleForm.geral.saida}
                        onChange={(e) => setScheduleForm({ 
                          ...scheduleForm, 
                          geral: { ...scheduleForm.geral, saida: e.target.value }
                        })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Início Almoço</label>
                      <input
                        type="time"
                        value={scheduleForm.geral.inicioAlmoco}
                        onChange={(e) => setScheduleForm({ 
                          ...scheduleForm, 
                          geral: { ...scheduleForm.geral, inicioAlmoco: e.target.value }
                        })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-blue-800 mb-1">Fim Almoço</label>
                      <input
                        type="time"
                        value={scheduleForm.geral.fimAlmoco}
                        onChange={(e) => setScheduleForm({ 
                          ...scheduleForm, 
                          geral: { ...scheduleForm.geral, fimAlmoco: e.target.value }
                        })}
                        className="w-full px-2 py-1 border border-blue-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Seletor para adicionar dias específicos */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Dias com Horários Específicos</h3>
                  <p className="text-sm text-gray-600 mb-4">Adicione apenas os dias que precisam de horários diferentes do padrão geral.</p>
                  
                  <div className="flex flex-wrap gap-2 mb-4">
                    {['segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado', 'domingo'].map(dia => {
                      const isSelected = scheduleForm.diasEspecificos[dia] !== undefined
                      const dayLabel = {
                        segunda: 'Segunda-feira',
                        terca: 'Terça-feira', 
                        quarta: 'Quarta-feira',
                        quinta: 'Quinta-feira',
                        sexta: 'Sexta-feira',
                        sabado: 'Sábado',
                        domingo: 'Domingo'
                      }[dia]
                      
                      return (
                        <button
                          key={dia}
                          onClick={() => {
                            if (isSelected) {
                              // Remover dia específico
                              const newDiasEspecificos = { ...scheduleForm.diasEspecificos }
                              delete newDiasEspecificos[dia]
                              setScheduleForm({ 
                                ...scheduleForm, 
                                diasEspecificos: newDiasEspecificos
                              })
                            } else {
                              // Adicionar dia específico com valores do horário geral
                              setScheduleForm({ 
                                ...scheduleForm, 
                                diasEspecificos: {
                                  ...scheduleForm.diasEspecificos,
                                  [dia]: { ...scheduleForm.geral }
                                }
                              })
                            }
                          }}
                          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? 'bg-green-600 text-white hover:bg-green-700'
                              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : '+ '}{dayLabel}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Formulários para dias específicos */}
                {Object.entries(scheduleForm.diasEspecificos).map(([dia, horario]) => {
                  const dayLabel = {
                    segunda: 'Segunda-feira',
                    terca: 'Terça-feira', 
                    quarta: 'Quarta-feira',
                    quinta: 'Quinta-feira',
                    sexta: 'Sexta-feira',
                    sabado: 'Sábado',
                    domingo: 'Domingo'
                  }[dia]
                  
                  return (
                    <div key={dia} className="border border-orange-200 bg-orange-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <h4 className="font-medium text-orange-900">{dayLabel}</h4>
                        <button
                          onClick={() => {
                            const newDiasEspecificos = { ...scheduleForm.diasEspecificos }
                            delete newDiasEspecificos[dia]
                            setScheduleForm({ 
                              ...scheduleForm, 
                              diasEspecificos: newDiasEspecificos
                            })
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          ✕ Remover
                        </button>
                      </div>
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">Entrada</label>
                          <input
                            type="time"
                            value={horario.entrada}
                            onChange={(e) => setScheduleForm({ 
                              ...scheduleForm, 
                              diasEspecificos: { 
                                ...scheduleForm.diasEspecificos, 
                                [dia]: { ...horario, entrada: e.target.value }
                              }
                            })}
                            className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">Saída</label>
                          <input
                            type="time"
                            value={horario.saida}
                            onChange={(e) => setScheduleForm({ 
                              ...scheduleForm, 
                              diasEspecificos: { 
                                ...scheduleForm.diasEspecificos, 
                                [dia]: { ...horario, saida: e.target.value }
                              }
                            })}
                            className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">Início Almoço</label>
                          <input
                            type="time"
                            value={horario.inicioAlmoco}
                            onChange={(e) => setScheduleForm({ 
                              ...scheduleForm, 
                              diasEspecificos: { 
                                ...scheduleForm.diasEspecificos, 
                                [dia]: { ...horario, inicioAlmoco: e.target.value }
                              }
                            })}
                            className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-orange-800 mb-1">Fim Almoço</label>
                          <input
                            type="time"
                            value={horario.fimAlmoco}
                            onChange={(e) => setScheduleForm({ 
                              ...scheduleForm, 
                              diasEspecificos: { 
                                ...scheduleForm.diasEspecificos, 
                                [dia]: { ...horario, fimAlmoco: e.target.value }
                              }
                            })}
                            className="w-full px-2 py-1 border border-orange-300 rounded text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent text-gray-900 bg-white"
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}

                {Object.keys(scheduleForm.diasEspecificos).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum dia específico adicionado.</p>
                    <p className="text-sm">O horário geral será usado para todos os dias da semana.</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-3 mt-8">
              <button
                onClick={() => setShowScheduleModal(false)}
                disabled={isSubmittingSchedule}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitSchedule}
                disabled={isSubmittingSchedule}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isSubmittingSchedule ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Salvar Horários</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}