'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import {
  FaFileAlt,
  FaSpinner,
  FaUser,
  FaSearch,
  FaExclamationTriangle,
  FaHome,
  FaCheckCircle,
  FaClock,
  FaTimesCircle,
  FaExternalLinkAlt,
  FaCheck,
  FaTimes
} from 'react-icons/fa'

interface AusenciaComNome {
  id: string
  funcionarioEmail: string
  funcionarioNome: string
  data: string
  tipo: 'falta' | 'atestado' | 'licenca'
  justificativa: string
  linkDocumento?: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  dataEnvio?: string
  dataAnalise?: string
  analisadoPor?: string
  motivoRejeicao?: string
}

export default function CoordenadorAusencias() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()

  const [ausencias, setAusencias] = useState<AusenciaComNome[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  const [filterTipo, setFilterTipo] = useState<string>('todos')

  // Modal de rejeição
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectingAusencia, setRejectingAusencia] = useState<AusenciaComNome | null>(null)
  const [rejectMotivo, setRejectMotivo] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Verificar acesso
  useEffect(() => {
    if (!isLoadingUser && usuario) {
      const isCoordenador = usuario.niveisHierarquicos.includes('coordenador')
      if (!isCoordenador) {
        router.push('/dashboard')
      }
    }
  }, [usuario, isLoadingUser, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session && usuario) {
      loadData()
    }
  }, [session, usuario])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch('/api/coordenador/ausencias')
      const data = await response.json()

      if (data.success) {
        setAusencias(data.ausencias || [])
      } else {
        setError(data.error || 'Erro ao carregar ausências')
      }
    } catch (error) {
      console.error('Erro ao carregar ausências:', error)
      setError('Erro ao carregar ausências')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAprovar = async (ausencia: AusenciaComNome) => {
    if (!confirm(`Deseja aprovar a ausência de ${ausencia.funcionarioNome} do dia ${formatDate(ausencia.data)}?`)) {
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/coordenador/ausencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ausenciaId: ausencia.id,
          status: 'aprovada'
        })
      })

      const data = await response.json()

      if (data.success) {
        await loadData()
      } else {
        alert(data.error || 'Erro ao aprovar ausência')
      }
    } catch (error) {
      console.error('Erro ao aprovar ausência:', error)
      alert('Erro ao aprovar ausência')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRejeitar = (ausencia: AusenciaComNome) => {
    setRejectingAusencia(ausencia)
    setRejectMotivo('')
    setShowRejectModal(true)
  }

  const handleConfirmReject = async () => {
    if (!rejectingAusencia) return

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/coordenador/ausencias', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ausenciaId: rejectingAusencia.id,
          status: 'rejeitada',
          motivo: rejectMotivo || undefined
        })
      })

      const data = await response.json()

      if (data.success) {
        setShowRejectModal(false)
        setRejectingAusencia(null)
        await loadData()
      } else {
        alert(data.error || 'Erro ao reprovar ausência')
      }
    } catch (error) {
      console.error('Erro ao reprovar ausência:', error)
      alert('Erro ao reprovar ausência')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '—'
    return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR')
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'atestado': return 'Atestado Médico'
      case 'licenca': return 'Licença'
      default: return 'Falta'
    }
  }

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case 'atestado': return 'bg-purple-100 text-purple-800'
      case 'licenca': return 'bg-blue-100 text-blue-800'
      default: return 'bg-orange-100 text-orange-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada': return <FaCheckCircle className="text-green-500" />
      case 'rejeitada': return <FaTimesCircle className="text-red-500" />
      default: return <FaClock className="text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada': return 'Aprovada'
      case 'rejeitada': return 'Rejeitada'
      default: return 'Pendente'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'aprovada': return 'bg-green-100 text-green-800'
      case 'rejeitada': return 'bg-red-100 text-red-800'
      default: return 'bg-yellow-100 text-yellow-800'
    }
  }

  const filteredAusencias = ausencias.filter(a => {
    const matchesSearch = a.funcionarioNome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.funcionarioEmail.toLowerCase().includes(searchTerm.toLowerCase())
    if (!matchesSearch) return false
    if (filterStatus !== 'todos' && a.status !== filterStatus) return false
    if (filterTipo !== 'todos' && a.tipo !== filterTipo) return false
    return true
  })

  const stats = {
    total: ausencias.length,
    pendentes: ausencias.filter(a => a.status === 'pendente').length,
    aprovadas: ausencias.filter(a => a.status === 'aprovada').length,
    rejeitadas: ausencias.filter(a => a.status === 'rejeitada').length,
  }

  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando ausências...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!usuario || !usuario.niveisHierarquicos.includes('coordenador')) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <FaExclamationTriangle className="text-white text-4xl mx-auto mb-4" />
            <h2 className="text-white text-2xl font-bold mb-2">Acesso Negado</h2>
            <p className="text-red-200 mb-6">Você não tem permissão para acessar esta página.</p>
            <button
              onClick={() => router.push('/dashboard')}
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
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 relative overflow-hidden">
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
                onClick={() => router.push('/coordenador/dashboard')}
                className="flex items-center hover:text-white transition-colors"
              >
                <FaHome className="mr-1" />
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">Ausências</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <FaFileAlt className="mr-3 text-blue-300" />
                  Ausências dos Funcionários
                </h1>
                <p className="text-blue-200 text-lg">
                  Gerencie as ausências justificadas da sua equipe
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {stats.pendentes}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                  <span className="text-blue-200 text-sm">Pendentes</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FaFileAlt className="text-blue-600" />
              </div>
              <div className="ml-3">
                <p className="text-gray-500 text-xs">Total</p>
                <p className="text-xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <FaClock className="text-yellow-600" />
              </div>
              <div className="ml-3">
                <p className="text-gray-500 text-xs">Pendentes</p>
                <p className="text-xl font-bold text-yellow-600">{stats.pendentes}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <FaCheckCircle className="text-green-600" />
              </div>
              <div className="ml-3">
                <p className="text-gray-500 text-xs">Aprovadas</p>
                <p className="text-xl font-bold text-green-600">{stats.aprovadas}</p>
              </div>
            </div>
          </div>

          <div className="bg-white/95 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <FaTimesCircle className="text-red-600" />
              </div>
              <div className="ml-3">
                <p className="text-gray-500 text-xs">Rejeitadas</p>
                <p className="text-xl font-bold text-red-600">{stats.rejeitadas}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Busca */}
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por funcionário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              />
            </div>

            {/* Filtro Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="todos">Todos os Status</option>
              <option value="pendente">Pendentes</option>
              <option value="aprovada">Aprovadas</option>
              <option value="rejeitada">Rejeitadas</option>
            </select>

            {/* Filtro Tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="falta">Falta</option>
              <option value="atestado">Atestado Médico</option>
              <option value="licenca">Licença</option>
            </select>
          </div>
        </div>

        {/* Lista de Ausências */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Ausências Registradas</h2>
            <p className="text-gray-600 mt-2">
              {filteredAusencias.length} ausência{filteredAusencias.length !== 1 ? 's' : ''} encontrada{filteredAusencias.length !== 1 ? 's' : ''}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Carregando ausências...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 text-center">
              <FaExclamationTriangle className="text-4xl text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-red-600 mb-2">Erro ao Carregar</h3>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={loadData}
                className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          ) : filteredAusencias.length === 0 ? (
            <div className="p-8 text-center">
              <FaFileAlt className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhuma Ausência Encontrada</h3>
              <p className="text-gray-500">
                {searchTerm || filterStatus !== 'todos' || filterTipo !== 'todos'
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há ausências registradas pelos funcionários da sua coordenação.'}
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredAusencias.map((ausencia) => (
                <div
                  key={ausencia.id}
                  className={`border rounded-xl p-6 transition-shadow hover:shadow-md ${
                    ausencia.status === 'pendente'
                      ? 'border-yellow-200 bg-yellow-50/50'
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Info principal */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        {/* Nome do funcionário */}
                        <div className="flex items-center">
                          <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center mr-2">
                            <FaUser className="text-white text-xs" />
                          </div>
                          <span className="font-semibold text-gray-900">
                            {ausencia.funcionarioNome}
                          </span>
                        </div>

                        {/* Badge tipo */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTipoColor(ausencia.tipo)}`}>
                          {getTipoText(ausencia.tipo)}
                        </span>

                        {/* Badge status */}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(ausencia.status)}`}>
                          {getStatusIcon(ausencia.status)}
                          <span className="ml-1">{getStatusText(ausencia.status)}</span>
                        </span>
                      </div>

                      {/* Data da ausência */}
                      <div className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Data da ausência:</span> {formatDate(ausencia.data)}
                      </div>

                      {/* Justificativa */}
                      <p className="text-gray-700 mb-3">
                        {ausencia.justificativa}
                      </p>

                      {/* Link do documento */}
                      {ausencia.linkDocumento && (
                        <div className="mb-3">
                          <a
                            href={ausencia.linkDocumento}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors text-sm"
                          >
                            <FaExternalLinkAlt className="text-xs" />
                            <span>Ver Documento</span>
                          </a>
                        </div>
                      )}

                      {/* Metadados */}
                      <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                        {ausencia.dataEnvio && (
                          <span>Enviado em: {formatDateTime(ausencia.dataEnvio)}</span>
                        )}
                        {ausencia.dataAnalise && (
                          <span>Analisado em: {formatDateTime(ausencia.dataAnalise)}</span>
                        )}
                        {ausencia.analisadoPor && (
                          <span>Por: {ausencia.analisadoPor}</span>
                        )}
                      </div>

                      {/* Motivo da rejeição */}
                      {ausencia.status === 'rejeitada' && ausencia.motivoRejeicao && (
                        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">
                            <span className="font-medium">Motivo da rejeição:</span> {ausencia.motivoRejeicao}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações */}
                    {ausencia.status === 'pendente' && (
                      <div className="flex lg:flex-col gap-2 lg:min-w-[140px]">
                        <button
                          onClick={() => handleAprovar(ausencia)}
                          disabled={isSubmitting}
                          className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                        >
                          <FaCheck className="mr-2" />
                          Aprovar
                        </button>
                        <button
                          onClick={() => handleRejeitar(ausencia)}
                          disabled={isSubmitting}
                          className="flex-1 lg:flex-none flex items-center justify-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                        >
                          <FaTimes className="mr-2" />
                          Reprovar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Modal de Rejeição */}
      {showRejectModal && rejectingAusencia && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaTimesCircle className="text-red-600 text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Reprovar Ausência
              </h2>
              <p className="text-gray-600">
                Ausência de <span className="font-semibold">{rejectingAusencia.funcionarioNome}</span> em {formatDate(rejectingAusencia.data)}
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Motivo da reprovação (opcional)
              </label>
              <textarea
                value={rejectMotivo}
                onChange={(e) => setRejectMotivo(e.target.value)}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                placeholder="Descreva o motivo da reprovação..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectingAusencia(null)
                }}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmReject}
                disabled={isSubmitting}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Reprovando...</span>
                  </>
                ) : (
                  <>
                    <FaTimes />
                    <span>Confirmar Reprovação</span>
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
