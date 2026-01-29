"use client"
import React, { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaDatabase, 
  FaSpinner, 
  FaExclamationTriangle, 
  FaTable, 
  FaSearch, 
  FaDownload, 
  FaRedo,
  FaEye,
  FaCog,
  FaChevronDown,
  FaChevronUp,
  FaHome,
  FaUsers,
  FaClock,
  FaBuilding,
  FaHistory,
  FaUserShield,
  FaMapMarkerAlt,
  FaSave,
  FaEdit
} from 'react-icons/fa'

interface DatabaseStats {
  totalRecords: number
  collectionName: string
  lastUpdated: string
}

interface SystemConfig {
  geolocation: {
    enabled: boolean
    workplaceLatitude: number
    workplaceLongitude: number
    allowedRadiusMeters: number
  }
  workday: {
    defaultHours: number
    maxHoursPerDay: number
  }
  lunchBreak: {
    defaultDurationHours: number
    defaultDurationMinutes: number
    minDurationMinutes: number
    maxDurationHours: number
  }
}

const DatabaseAdminPage = () => {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  const [collection, setCollection] = useState("usuarios")
  const [data, setData] = useState<Record<string, unknown>[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set())
  const [stats, setStats] = useState<DatabaseStats | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  
  // Estados para configuração do sistema
  const [showConfig, setShowConfig] = useState(false)
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null)
  const [configLoading, setConfigLoading] = useState(false)
  const [configError, setConfigError] = useState<string | null>(null)
  const [isSavingConfig, setIsSavingConfig] = useState(false)

  // Verificar se o usuário tem acesso
  useEffect(() => {
    if (!isLoadingUser && usuario && !usuario.niveisHierarquicos.includes('administrador')) {
      router.push('/administrador/dashboard')
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
    if (status === "unauthenticated") {
      router.push("/login")
    }
  }, [status, router])

  const fetchCollectionData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/administrador/database?collection=${collection}`)
      if (!res.ok) {
        throw new Error("Falha ao buscar dados da coleção")
      }
      const jsonData = await res.json()
      setData(jsonData)
      
      // Calcular estatísticas
      setStats({
        totalRecords: jsonData.length,
        collectionName: collection,
        lastUpdated: new Date().toLocaleString('pt-BR')
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ocorreu um erro desconhecido")
    } finally {
      setLoading(false)
    }
  }, [collection])

  useEffect(() => {
    if (session && usuario?.niveisHierarquicos.includes('administrador')) {
      fetchCollectionData()
    }
  }, [collection, session, usuario?.niveisHierarquicos, fetchCollectionData])

  // Carregar configurações do sistema
  const loadSystemConfig = async () => {
    setConfigLoading(true)
    setConfigError(null)
    try {
      const res = await fetch('/api/administrador/config')
      const data = await res.json()
      
      if (data.success) {
        setSystemConfig(data.config)
      } else {
        setConfigError(data.error || 'Erro ao carregar configurações')
      }
    } catch (err) {
      setConfigError(err instanceof Error ? err.message : 'Erro ao carregar configurações')
    } finally {
      setConfigLoading(false)
    }
  }

  // Salvar configurações do sistema
  const saveSystemConfig = async () => {
    if (!systemConfig) return

    setIsSavingConfig(true)
    try {
      const res = await fetch('/api/administrador/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ config: systemConfig })
      })
      
      const data = await res.json()
      
      if (data.success) {
        alert('Configurações salvas com sucesso!')
      } else {
        alert(data.error || 'Erro ao salvar configurações')
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Erro ao salvar configurações')
    } finally {
      setIsSavingConfig(false)
    }
  }

  // Carregar configurações quando mostrar a seção
  useEffect(() => {
    if (showConfig && !systemConfig) {
      loadSystemConfig()
    }
  }, [showConfig, systemConfig])

  const handleCollectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCollection(e.target.value)
    setExpandedRows(new Set())
    setSearchTerm("")
  }

  const toggleRowExpansion = (index: number) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(index)) {
      newExpanded.delete(index)
    } else {
      newExpanded.add(index)
    }
    setExpandedRows(newExpanded)
  }

  const formatValue = (value: unknown): string => {
    if (value === null || value === undefined) return "N/A"
    if (typeof value === "boolean") return value ? "Sim" : "Não"
    if (typeof value === "object" && value !== null) {
      if ('seconds' in value && typeof value.seconds === 'number') {
        // Firebase Timestamp
        return new Date(value.seconds * 1000).toLocaleString('pt-BR')
      }
      return JSON.stringify(value, null, 2)
    }
    if (typeof value === "string" && value.length > 50) {
      return value.substring(0, 50) + "..."
    }
    return String(value)
  }

  const getCollectionIcon = (collectionName: string) => {
    switch (collectionName) {
      case 'usuarios': return <FaUsers className="text-blue-600" />
      case 'pontos': return <FaClock className="text-green-600" />
      case 'coordenacoes': return <FaBuilding className="text-purple-600" />
      case 'horarios': return <FaHistory className="text-orange-600" />
      case 'databaseAdmins': return <FaUserShield className="text-red-600" />
      default: return <FaTable className="text-gray-600" />
    }
  }

  const getCollectionColor = (collectionName: string) => {
    switch (collectionName) {
      case 'usuarios': return 'from-blue-500 to-blue-600'
      case 'pontos': return 'from-green-500 to-green-600'
      case 'coordenacoes': return 'from-purple-500 to-purple-600'
      case 'horarios': return 'from-orange-500 to-orange-600'
      case 'databaseAdmins': return 'from-red-500 to-red-600'
      default: return 'from-gray-500 to-gray-600'
    }
  }

  const filteredData = data.filter(item => {
    if (!searchTerm) return true
    const searchableText = Object.values(item).join(' ').toLowerCase()
    return searchableText.includes(searchTerm.toLowerCase())
  })

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${collection}_${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (status === "loading" || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando interface do banco de dados...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!session || !usuario?.niveisHierarquicos.includes('administrador')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <FaExclamationTriangle className="text-white text-4xl mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-red-200 mb-6">Você não tem permissão para acessar o banco de dados.</p>
            <button
              onClick={() => router.push('/administrador/dashboard')}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-900 via-teal-800 to-cyan-900 relative overflow-hidden">
      {/* Padrão de fundo decorativo */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/3 to-transparent"></div>
      </div>

      <Header />
      
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb e Cabeçalho */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            {/* Breadcrumb */}
            <div className="flex items-center text-white/80 text-sm mb-4">
              <button
                onClick={() => router.push('/administrador/dashboard')}
                className="flex items-center hover:text-white transition-colors"
              >
                <FaHome className="mr-1" />
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">Banco de Dados</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <FaDatabase className="mr-3 text-teal-300" />
                  Banco de Dados Firebase
                </h1>
                <p className="text-teal-200 text-lg">
                  Interface administrativa para visualização e exportação de dados
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {currentTime.toLocaleTimeString('pt-BR')}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></div>
                  <span className="text-teal-200 text-sm">Sistema Conectado</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas da Coleção */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className={`p-3 bg-gradient-to-r ${getCollectionColor(collection)} rounded-lg`}>
                  {getCollectionIcon(collection)}
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Coleção Ativa</p>
                  <p className="text-xl font-bold text-gray-900 capitalize">{stats.collectionName}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                  <FaTable className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Total de Registros</p>
                  <p className="text-xl font-bold text-gray-900">{stats.totalRecords.toLocaleString('pt-BR')}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                  <FaCog className="text-white text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-gray-500 text-sm">Última Atualização</p>
                  <p className="text-sm font-medium text-gray-900">{stats.lastUpdated}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Configurações do Sistema */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <FaCog className="text-purple-600 text-xl mr-3" />
              <h2 className="text-xl font-bold text-gray-900">Configurações do Sistema</h2>
            </div>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              <FaEdit />
              <span>{showConfig ? 'Ocultar' : 'Configurar'}</span>
            </button>
          </div>

          {showConfig && (
            <div className="border-t pt-6">
              {configLoading && (
                <div className="flex items-center justify-center py-8">
                  <FaSpinner className="animate-spin text-2xl text-purple-600 mr-3" />
                  <span className="text-gray-600">Carregando configurações...</span>
                </div>
              )}

              {configError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-600 mr-2" />
                    <span className="text-red-700">{configError}</span>
                  </div>
                  <button
                    onClick={loadSystemConfig}
                    className="mt-2 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Tentar Novamente
                  </button>
                </div>
              )}

              {systemConfig && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Configurações de Geolocalização */}
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                    <h3 className="text-lg font-bold text-blue-900 mb-4 flex items-center">
                      <FaMapMarkerAlt className="mr-2" />
                      Geolocalização
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="geolocation-enabled"
                          checked={systemConfig.geolocation.enabled}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            geolocation: {
                              ...systemConfig.geolocation,
                              enabled: e.target.checked
                            }
                          })}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <label htmlFor="geolocation-enabled" className="text-blue-800 font-medium">
                          Ativar validação por geolocalização
                        </label>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">
                            Latitude do local de trabalho
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={systemConfig.geolocation.workplaceLatitude}
                            onChange={(e) => setSystemConfig({
                              ...systemConfig,
                              geolocation: {
                                ...systemConfig.geolocation,
                                workplaceLatitude: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="-15.7942"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-blue-800 mb-1">
                            Longitude do local de trabalho
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={systemConfig.geolocation.workplaceLongitude}
                            onChange={(e) => setSystemConfig({
                              ...systemConfig,
                              geolocation: {
                                ...systemConfig.geolocation,
                                workplaceLongitude: parseFloat(e.target.value) || 0
                              }
                            })}
                            className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                            placeholder="-47.8822"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-blue-800 mb-1">
                          Raio de tolerância (metros)
                        </label>
                        <input
                          type="number"
                          min="10"
                          max="10000"
                          value={systemConfig.geolocation.allowedRadiusMeters}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            geolocation: {
                              ...systemConfig.geolocation,
                              allowedRadiusMeters: parseInt(e.target.value) || 100
                            }
                          })}
                          className="w-full px-3 py-2 border border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                          placeholder="100"
                        />
                        <p className="text-xs text-blue-600 mt-1">
                          Distância máxima permitida do local de trabalho (10-10000 metros)
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Configurações de Jornada */}
                  <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                    <h3 className="text-lg font-bold text-green-900 mb-4 flex items-center">
                      <FaClock className="mr-2" />
                      Jornada de Trabalho
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Horas padrão por dia
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={systemConfig.workday.defaultHours}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            workday: {
                              ...systemConfig.workday,
                              defaultHours: parseInt(e.target.value) || 8
                            }
                          })}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-green-800 mb-1">
                          Máximo de horas por dia
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="24"
                          value={systemConfig.workday.maxHoursPerDay}
                          onChange={(e) => setSystemConfig({
                            ...systemConfig,
                            workday: {
                              ...systemConfig.workday,
                              maxHoursPerDay: parseInt(e.target.value) || 12
                            }
                          })}
                          className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-1">
                            Duração padrão almoço (horas)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="4"
                            value={systemConfig.lunchBreak.defaultDurationHours}
                            onChange={(e) => setSystemConfig({
                              ...systemConfig,
                              lunchBreak: {
                                ...systemConfig.lunchBreak,
                                defaultDurationHours: parseInt(e.target.value) || 1
                              }
                            })}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-green-800 mb-1">
                            Duração padrão almoço (minutos)
                          </label>
                          <input
                            type="number"
                            min="0"
                            max="59"
                            step="15"
                            value={systemConfig.lunchBreak.defaultDurationMinutes}
                            onChange={(e) => setSystemConfig({
                              ...systemConfig,
                              lunchBreak: {
                                ...systemConfig.lunchBreak,
                                defaultDurationMinutes: parseInt(e.target.value) || 0
                              }
                            })}
                            className="w-full px-3 py-2 border border-green-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {systemConfig && (
                <div className="flex justify-end mt-6">
                  <button
                    onClick={saveSystemConfig}
                    disabled={isSavingConfig}
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-2 rounded-lg transition-colors"
                  >
                    {isSavingConfig ? (
                      <>
                        <FaSpinner className="animate-spin" />
                        <span>Salvando...</span>
                      </>
                    ) : (
                      <>
                        <FaSave />
                        <span>Salvar Configurações</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Controles da Página */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Seletor de Coleção */}
            <div className="flex items-center space-x-4">
              <label htmlFor="collection-select" className="text-gray-700 font-medium whitespace-nowrap">
                Coleção:
              </label>
              <select
                id="collection-select"
                value={collection}
                onChange={handleCollectionChange}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 min-w-[200px]"
              >
                <option value="usuarios">👥 Usuários</option>
                <option value="pontos">🕐 Pontos</option>
                <option value="coordenacoes">🏢 Coordenações</option>
                <option value="horarios">📅 Horários</option>
                <option value="databaseAdmins">🛡️ Admins do Banco</option>
              </select>
            </div>

            {/* Busca e Ações */}
            <div className="flex items-center space-x-3 flex-wrap">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar nos dados..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 min-w-[250px]"
                />
              </div>
              
              <button
                onClick={fetchCollectionData}
                disabled={loading}
                className="flex items-center space-x-2 bg-teal-600 hover:bg-teal-700 disabled:bg-teal-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FaRedo className={loading ? "animate-spin" : ""} />
                <span>Atualizar</span>
              </button>
              
              <button
                onClick={exportToJSON}
                disabled={filteredData.length === 0}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <FaDownload />
                <span>Exportar</span>
              </button>
            </div>
          </div>
        </div>

        {/* Conteúdo Principal */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-teal-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Carregando dados da coleção...</p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-8 text-center">
              <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">Erro ao Carregar Dados</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchCollectionData}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {!loading && !error && filteredData.length === 0 && (
            <div className="p-8 text-center">
              <FaTable className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhum Registro Encontrado</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Esta coleção não possui dados.'}
              </p>
            </div>
          )}

          {!loading && !error && filteredData.length > 0 && (
            <>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">
                      Dados da Coleção: {collection}
                    </h2>
                    <p className="text-gray-600 text-sm mt-1">
                      Exibindo {filteredData.length} de {data.length} registros
                      {searchTerm && ` (filtrado por: "${searchTerm}")`}
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    Clique em uma linha para expandir os detalhes
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      {filteredData.length > 0 &&
                        Object.keys(filteredData[0]).slice(0, 5).map((key) => (
                          <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {key}
                          </th>
                        ))}
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredData.map((item, index) => (
                      <React.Fragment key={index}>
                        <tr className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {index + 1}
                          </td>
                          {Object.entries(item).slice(0, 5).map(([, value], i) => (
                            <td key={i} className="px-6 py-4 text-sm text-gray-900">
                              <div className="max-w-xs truncate" title={String(value)}>
                                {formatValue(value)}
                              </div>
                            </td>
                          ))}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button
                              onClick={() => toggleRowExpansion(index)}
                              className="flex items-center space-x-1 text-teal-600 hover:text-teal-900 transition-colors"
                            >
                              <FaEye />
                              {expandedRows.has(index) ? (
                                <>
                                  <FaChevronUp />
                                  <span>Ocultar</span>
                                </>
                              ) : (
                                <>
                                  <FaChevronDown />
                                  <span>Expandir</span>
                                </>
                              )}
                            </button>
                          </td>
                        </tr>
                        {expandedRows.has(index) && (
                          <tr>
                            <td colSpan={7} className="px-6 py-4 bg-gray-50">
                              <div className="rounded-lg bg-white p-4 border border-gray-200">
                                <h4 className="font-medium text-gray-900 mb-3">Dados Completos do Registro</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {Object.entries(item).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 p-3 rounded">
                                      <dt className="text-sm font-medium text-gray-600 mb-1">{key}</dt>
                                      <dd className="text-sm text-gray-900 break-all">
                                        {typeof value === "object" && value !== null ? (
                                          <pre className="whitespace-pre-wrap text-xs bg-white p-2 rounded border">
                                            {JSON.stringify(value, null, 2)}
                                          </pre>
                                        ) : (
                                          formatValue(value)
                                        )}
                                      </dd>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  )
}

export default DatabaseAdminPage