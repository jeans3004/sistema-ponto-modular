'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/dashboard/Header'
import { formatDate } from '@/lib/utils'
import { useUsuario } from '@/hooks/useUsuario'
import { NivelHierarquico } from '@/types/usuario'
import { 
  FaUserShield, 
  FaSpinner, 
  FaClock, 
  FaUsers,
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
  FaCog,
  FaDatabase,
  FaShieldAlt,
  FaUserPlus,
  FaUserTimes,
  FaBan,
  FaUndo,
  FaTrash,
  FaFileAlt
} from 'react-icons/fa'

interface Usuario {
  id: string
  email: string
  nome: string
  foto?: string
  niveisHierarquicos: NivelHierarquico[]
  nivelAtivo: NivelHierarquico
  status: 'ativo' | 'pendente' | 'inativo'
  aprovadoPor?: string
  dataAprovacao?: any
  dataCadastro?: any
  dataAlteracao?: any
}

interface SystemStats {
  totalUsuarios: number
  usuariosAtivos: number
  usuariosPendentes: number
  usuariosInativos: number
  totalAdmins: number
  totalCoordenadores: number
  totalColaboradores: number
  registrosHoje: number
}

export default function AdministradorDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  // Estados principais
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [stats, setStats] = useState<SystemStats | null>(null)
  const [isLoadingData, setIsLoadingData] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Estados para gerenciamento de usuários
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [actionType, setActionType] = useState<'aprovar' | 'rejeitar' | 'alterar' | 'inativar'>('aprovar')
  const [selectedLevels, setSelectedLevels] = useState<NivelHierarquico[]>([])
  const [isSubmittingAction, setIsSubmittingAction] = useState(false)
  
  // Estados para filtros e busca
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'todos' | 'ativo' | 'pendente' | 'inativo'>('todos')
  const [filterLevel, setFilterLevel] = useState<'todos' | NivelHierarquico>('todos')

  // Verificar se o usuário tem acesso a este dashboard
  useEffect(() => {
    if (!isLoadingUser && usuario && !usuario.niveisHierarquicos.includes('administrador')) {
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
      loadAdminData()
    }
  }, [session])

  const loadAdminData = async () => {
    try {
      setIsLoadingData(true)
      
      // Carregar todos os usuários
      const usuariosResponse = await fetch('/api/admin/usuarios')
      const usuariosData = await usuariosResponse.json()
      
      if (usuariosData.success) {
        setUsuarios(usuariosData.usuarios)
        
        // Calcular estatísticas
        const stats: SystemStats = {
          totalUsuarios: usuariosData.usuarios.length,
          usuariosAtivos: usuariosData.usuarios.filter((u: Usuario) => u.status === 'ativo').length,
          usuariosPendentes: usuariosData.usuarios.filter((u: Usuario) => u.status === 'pendente').length,
          usuariosInativos: usuariosData.usuarios.filter((u: Usuario) => u.status === 'inativo').length,
          totalAdmins: usuariosData.usuarios.filter((u: Usuario) => u.niveisHierarquicos.includes('administrador')).length,
          totalCoordenadores: usuariosData.usuarios.filter((u: Usuario) => u.niveisHierarquicos.includes('coordenador')).length,
          totalColaboradores: usuariosData.usuarios.filter((u: Usuario) => u.niveisHierarquicos.includes('colaborador')).length,
          registrosHoje: 0 // Será calculado se necessário
        }
        
        setStats(stats)
      }
    } catch (error) {
      console.error('Erro ao carregar dados do administrador:', error)
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleUserAction = async (user: Usuario, action: typeof actionType) => {
    setSelectedUser(user)
    setActionType(action)
    
    // Pré-configurar níveis baseado na ação
    if (action === 'aprovar') {
      setSelectedLevels(['colaborador'])
    } else if (action === 'alterar') {
      setSelectedLevels(user.niveisHierarquicos)
    } else {
      setSelectedLevels([])
    }
    
    setShowUserModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedUser) return
    
    setIsSubmittingAction(true)
    try {
      const body: any = {
        acao: actionType,
        emailUsuario: selectedUser.email
      }
      
      if (actionType === 'aprovar' || actionType === 'alterar') {
        body.niveisHierarquicos = selectedLevels
      }
      
      const response = await fetch('/api/admin/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })
      
      const data = await response.json()
      
      if (data.success) {
        const actionMessages = {
          aprovar: 'Usuário aprovado com sucesso!',
          rejeitar: 'Usuário rejeitado com sucesso!',
          alterar: 'Níveis do usuário alterados com sucesso!',
          inativar: 'Usuário inativado com sucesso!'
        }
        
        alert(actionMessages[actionType])
        setShowUserModal(false)
        await loadAdminData() // Recarregar dados
      } else {
        alert(data.error || 'Erro na operação')
      }
    } catch (error) {
      console.error('Erro na ação do usuário:', error)
      alert('Erro na operação')
    } finally {
      setIsSubmittingAction(false)
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ativo': return 'Ativo'
      case 'pendente': return 'Pendente'
      case 'inativo': return 'Inativo'
      default: return status
    }
  }

  const getLevelBadgeColor = (level: NivelHierarquico) => {
    switch (level) {
      case 'administrador': return 'bg-red-100 text-red-800'
      case 'coordenador': return 'bg-blue-100 text-blue-800'
      case 'colaborador': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filterStatus !== 'todos' && user.status !== filterStatus) return false
    
    if (filterLevel !== 'todos' && !user.niveisHierarquicos.includes(filterLevel)) return false
    
    return true
  })

  if (status === 'loading' || isLoadingData || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando dashboard do administrador...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 relative overflow-hidden">
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
                <p className="text-red-200 text-lg">
                  Dashboard do Administrador • {formatDate(new Date())}
                </p>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-white mb-2">
                  {formatTime(currentTime)}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-red-400"></div>
                  <span className="text-red-200">Administrador Ativo</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas do Sistema */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FaUsers className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Total Usuários</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalUsuarios}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg">
                  <FaUserCheck className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Usuários Ativos</p>
                  <p className="text-2xl font-bold text-green-600">{stats.usuariosAtivos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-yellow-100 rounded-lg">
                  <FaClock className="text-yellow-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Pendentes</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.usuariosPendentes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg">
                  <FaUserShield className="text-red-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Administradores</p>
                  <p className="text-2xl font-bold text-red-600">{stats.totalAdmins}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ações Rápidas do Sistema */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Ações do Sistema</h3>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/admin/setup')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:from-red-100 hover:to-red-200 transition-all duration-200 border border-red-200"
              >
                <FaShieldAlt className="text-red-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-red-900">Setup do Sistema</p>
                  <p className="text-sm text-red-700">Configurações iniciais</p>
                </div>
                <FaArrowRight className="text-red-600" />
              </button>
              
              <button
                onClick={() => router.push('/relatorios')}
                className="w-full flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-200 border border-blue-200"
              >
                <FaChartLine className="text-blue-600 mr-3 text-lg" />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-blue-900">Relatórios Gerais</p>
                  <p className="text-sm text-blue-700">Análises completas</p>
                </div>
                <FaArrowRight className="text-blue-600" />
              </button>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Distribuição de Níveis</h3>
            {stats && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Administradores:</span>
                  <span className="font-semibold text-red-600">{stats.totalAdmins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Coordenadores:</span>
                  <span className="font-semibold text-blue-600">{stats.totalCoordenadores}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Colaboradores:</span>
                  <span className="font-semibold text-green-600">{stats.totalColaboradores}</span>
                </div>
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 font-medium">Total:</span>
                    <span className="font-bold text-gray-900">{stats.totalUsuarios}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-6 border border-white/20">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Status do Sistema</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Firebase conectado</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Autenticação ativa</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Backup automático</span>
              </div>
              <div className="flex items-center">
                <FaCheckCircle className="text-green-500 mr-3" />
                <span className="text-sm text-gray-700">Sistema operacional</span>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros e Busca para Usuários */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuário..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-2 flex-wrap">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="todos">Todos os Status</option>
                <option value="ativo">Ativos</option>
                <option value="pendente">Pendentes</option>
                <option value="inativo">Inativos</option>
              </select>
              
              <select
                value={filterLevel}
                onChange={(e) => setFilterLevel(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="todos">Todos os Níveis</option>
                <option value="administrador">Administradores</option>
                <option value="coordenador">Coordenadores</option>
                <option value="colaborador">Colaboradores</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Usuários */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h2>
            <p className="text-gray-600 mt-2">Gerencie todos os usuários do sistema e suas permissões</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Níveis Hierárquicos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nível Ativo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data Cadastro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsuarios.map((user) => (
                  <tr key={user.email} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {user.foto ? (
                          <img
                            src={user.foto}
                            alt={user.nome}
                            className="h-10 w-10 rounded-full mr-3"
                          />
                        ) : (
                          <div className="h-10 w-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                            <FaUser className="text-white text-sm" />
                          </div>
                        )}
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {user.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                        {getStatusText(user.status)}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {user.niveisHierarquicos.map((nivel) => (
                          <span
                            key={nivel}
                            className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getLevelBadgeColor(nivel)}`}
                          >
                            {nivel}
                          </span>
                        ))}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <span className={`font-medium ${getLevelBadgeColor(user.nivelAtivo).replace('bg-', 'text-').replace('-100', '-600')}`}>
                        {user.nivelAtivo}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.dataCadastro ? new Date(user.dataCadastro.seconds * 1000).toLocaleDateString('pt-BR') : 'N/A'}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex flex-wrap gap-1">
                        {user.status === 'pendente' && (
                          <>
                            <button
                              onClick={() => handleUserAction(user, 'aprovar')}
                              className="inline-flex items-center px-2 py-1 border border-green-300 text-green-700 rounded text-xs hover:bg-green-50 transition-colors"
                            >
                              <FaCheck className="mr-1" />
                              Aprovar
                            </button>
                            <button
                              onClick={() => handleUserAction(user, 'rejeitar')}
                              className="inline-flex items-center px-2 py-1 border border-red-300 text-red-700 rounded text-xs hover:bg-red-50 transition-colors"
                            >
                              <FaTimes className="mr-1" />
                              Rejeitar
                            </button>
                          </>
                        )}
                        
                        {user.status === 'ativo' && (
                          <>
                            <button
                              onClick={() => handleUserAction(user, 'alterar')}
                              className="inline-flex items-center px-2 py-1 border border-blue-300 text-blue-700 rounded text-xs hover:bg-blue-50 transition-colors"
                            >
                              <FaEdit className="mr-1" />
                              Níveis
                            </button>
                            <button
                              onClick={() => handleUserAction(user, 'inativar')}
                              className="inline-flex items-center px-2 py-1 border border-gray-300 text-gray-700 rounded text-xs hover:bg-gray-50 transition-colors"
                            >
                              <FaBan className="mr-1" />
                              Inativar
                            </button>
                          </>
                        )}
                        
                        {user.status === 'inativo' && (
                          <button
                            onClick={() => handleUserAction(user, 'alterar')}
                            className="inline-flex items-center px-2 py-1 border border-green-300 text-green-700 rounded text-xs hover:bg-green-50 transition-colors"
                          >
                            <FaUndo className="mr-1" />
                            Reativar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsuarios.length === 0 && (
            <div className="text-center py-12">
              <FaUsers className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum usuário encontrado</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm ? 'Tente uma busca diferente.' : 'Nenhum usuário corresponde aos filtros selecionados.'}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Modal de Ação do Usuário */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserShield className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {actionType === 'aprovar' && 'Aprovar Usuário'}
                {actionType === 'rejeitar' && 'Rejeitar Usuário'}
                {actionType === 'alterar' && 'Alterar Níveis'}
                {actionType === 'inativar' && 'Inativar Usuário'}
              </h2>
              <p className="text-gray-600">
                {selectedUser.nome}
              </p>
            </div>

            {(actionType === 'aprovar' || actionType === 'alterar') && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Selecione os níveis hierárquicos:
                </label>
                <div className="space-y-2">
                  {(['administrador', 'coordenador', 'colaborador'] as NivelHierarquico[]).map((level) => (
                    <label key={level} className="flex items-center">
                      <input
                        type="checkbox"
                        checked={selectedLevels.includes(level)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedLevels([...selectedLevels, level])
                          } else {
                            setSelectedLevels(selectedLevels.filter(l => l !== level))
                          }
                        }}
                        className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700 capitalize">{level}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {actionType === 'rejeitar' && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  Esta ação irá rejeitar o usuário permanentemente. O usuário não terá acesso ao sistema.
                </p>
              </div>
            )}

            {actionType === 'inativar' && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  Esta ação irá inativar o usuário temporariamente. O acesso pode ser restaurado posteriormente.
                </p>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={() => setShowUserModal(false)}
                disabled={isSubmittingAction}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={isSubmittingAction || ((actionType === 'aprovar' || actionType === 'alterar') && selectedLevels.length === 0)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isSubmittingAction ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FaCheck />
                    <span>Confirmar</span>
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