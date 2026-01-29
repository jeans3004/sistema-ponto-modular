'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { Usuario, Coordenacao, TipoColaborador } from '@/types/usuario'
import { 
  FaUsers, 
  FaSpinner, 
  FaEdit, 
  FaBuilding, 
  FaUser, 
  FaCheck, 
  FaTimes, 
  FaFilter,
  FaSearch,
  FaChevronDown,
  FaChevronUp,
  FaUserTag,
  FaCog,
  FaExclamationTriangle,
  FaHome,
  FaGraduationCap,
  FaBriefcase
} from 'react-icons/fa'

export default function GestaoFuncionarios() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [coordenacoes, setCoordenacoes] = useState<Coordenacao[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterCoordenacao, setFilterCoordenacao] = useState<string>('todos')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')
  
  // Estados do modal
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [modalAction, setModalAction] = useState<'coordenacao' | 'tipo'>('coordenacao')
  const [selectedCoordenacao, setSelectedCoordenacao] = useState('')
  const [selectedTipo, setSelectedTipo] = useState<TipoColaborador>('administrativo')

  // Verificar acesso
  useEffect(() => {
    if (!isLoadingUser && usuario) {
      const isAdmin = usuario.niveisHierarquicos.includes('administrador')
      const isCoordenador = usuario.niveisHierarquicos.includes('coordenador')
      
      if (!isAdmin && !isCoordenador) {
        router.push('/dashboard')
        return
      }
    }
  }, [usuario, isLoadingUser, router])

  // Carregar dados
  useEffect(() => {
    if (session && usuario) {
      loadData()
    }
  }, [session, usuario])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Carregar usuários
      const usuariosResponse = await fetch('/api/admin/usuarios-coordenacoes')
      const usuariosData = await usuariosResponse.json()

      if (usuariosData.success) {
        setUsuarios(usuariosData.usuarios)
      }

      // Carregar coordenações (só para admins)
      if (usuario?.niveisHierarquicos.includes('administrador')) {
        const coordenacoesResponse = await fetch('/api/admin/coordenacoes')
        const coordenacoesData = await coordenacoesResponse.json()

        if (coordenacoesData.success) {
          setCoordenacoes(coordenacoesData.coordenacoes)
        }
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUserAction = (user: Usuario, action: 'coordenacao' | 'tipo') => {
    setSelectedUser(user)
    setModalAction(action)
    
    if (action === 'coordenacao') {
      setSelectedCoordenacao(user.coordenacaoId || '')
    } else {
      setSelectedTipo(user.tipoColaborador || 'administrativo')
    }
    
    setShowModal(true)
  }

  const handleSubmitAction = async () => {
    if (!selectedUser) return

    setIsSubmitting(true)
    try {
      const body: Record<string, unknown> = {
        emailUsuario: selectedUser.email
      }

      if (modalAction === 'coordenacao') {
        if (selectedCoordenacao) {
          const coordenacao = coordenacoes.find(c => c.id === selectedCoordenacao)
          body.acao = 'atribuir-coordenacao'
          body.coordenacaoId = selectedCoordenacao
          body.coordenacaoNome = coordenacao?.nome
        } else {
          body.acao = 'remover-coordenacao'
        }
      } else {
        body.acao = 'definir-tipo-colaborador'
        body.tipoColaborador = selectedTipo
      }

      const response = await fetch('/api/admin/usuarios-coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      const data = await response.json()

      if (data.success) {
        alert('Usuário atualizado com sucesso!')
        setShowModal(false)
        await loadData()
      } else {
        alert(data.error || 'Erro na operação')
      }
    } catch (error) {
      console.error('Erro na ação:', error)
      alert('Erro na operação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-800'
      case 'pendente': return 'bg-yellow-100 text-yellow-800'
      case 'inativo': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTipoIcon = (tipo?: TipoColaborador) => {
    switch (tipo) {
      case 'docente': return <FaGraduationCap className="text-blue-600" />
      case 'administrativo': return <FaBriefcase className="text-gray-600" />
      default: return <FaUser className="text-gray-400" />
    }
  }

  const filteredUsuarios = usuarios.filter(user => {
    const matchesSearch = user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (!matchesSearch) return false
    
    if (filterStatus !== 'todos' && user.status !== filterStatus) return false
    
    if (filterCoordenacao !== 'todos') {
      if (filterCoordenacao === 'sem-coordenacao') {
        // Usuário não tem coordenações no novo formato e nem no legado
        if ((user.coordenacoes && user.coordenacoes.length > 0) || user.coordenacaoId) return false
      } else {
        // Verificar se o usuário pertence à coordenação especificada
        const temCoordenacao = (user.coordenacoes && user.coordenacoes.some(coord => coord.id === filterCoordenacao)) || 
                              user.coordenacaoId === filterCoordenacao
        if (!temCoordenacao) return false
      }
    }
    
    if (filterTipo !== 'todos') {
      if (filterTipo === 'sem-tipo') {
        if (user.tipoColaborador) return false
      } else {
        if (user.tipoColaborador !== filterTipo) return false
      }
    }
    
    return true
  })

  const isAdmin = usuario?.niveisHierarquicos.includes('administrador')
  const isCoordenador = usuario?.niveisHierarquicos.includes('coordenador')

  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando gestão de funcionários...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!usuario || (!isAdmin && !isCoordenador)) {
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
                onClick={() => router.push('/administrador/dashboard')}
                className="flex items-center hover:text-white transition-colors"
              >
                <FaHome className="mr-1" />
                Dashboard
              </button>
              <span className="mx-2">/</span>
              <span className="text-white font-medium">Gestão de Funcionários</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <FaUsers className="mr-3 text-blue-300" />
                  Gestão de Funcionários
                </h1>
                <p className="text-blue-200 text-lg">
                  {isAdmin ? 'Gerencie todos os funcionários do sistema' : 'Gerencie funcionários da sua coordenação'}
                </p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {filteredUsuarios.length}
                </div>
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                  <span className="text-blue-200 text-sm">Funcionários</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Busca */}
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

            {/* Filtro Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="todos">Todos os Status</option>
              <option value="ativo">Ativos</option>
              <option value="pendente">Pendentes</option>
              <option value="inativo">Inativos</option>
            </select>

            {/* Filtro Coordenação - só para admins */}
            {isAdmin && (
              <select
                value={filterCoordenacao}
                onChange={(e) => setFilterCoordenacao(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
              >
                <option value="todos">Todas Coordenações</option>
                <option value="sem-coordenacao">Sem Coordenação</option>
                {coordenacoes.map(coord => (
                  <option key={coord.id} value={coord.id}>{coord.nome}</option>
                ))}
              </select>
            )}

            {/* Filtro Tipo */}
            <select
              value={filterTipo}
              onChange={(e) => setFilterTipo(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
            >
              <option value="todos">Todos os Tipos</option>
              <option value="sem-tipo">Sem Tipo Definido</option>
              <option value="docente">Docentes</option>
              <option value="administrativo">Administrativos</option>
            </select>
          </div>
        </div>

        {/* Lista de Funcionários */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Lista de Funcionários</h2>
            <p className="text-gray-600 mt-2">
              Exibindo {filteredUsuarios.length} funcionários
              {!isAdmin && ' da sua coordenação'}
            </p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="animate-spin text-4xl text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600 text-lg">Carregando funcionários...</p>
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
          ) : filteredUsuarios.length === 0 ? (
            <div className="p-8 text-center">
              <FaUsers className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-600 mb-2">Nenhum Funcionário Encontrado</h3>
              <p className="text-gray-500">
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há funcionários cadastrados.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Funcionário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordenação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Níveis
                    </th>
                    {isAdmin && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    )}
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
                            <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
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
                          {user.status}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.coordenacoes && user.coordenacoes.length > 0 ? (
                          <div className="flex items-center flex-wrap gap-1">
                            <FaBuilding className="text-gray-400 mr-2" />
                            <div className="flex flex-wrap gap-1">
                              {user.coordenacoes.slice(0, 2).map(coord => (
                                <span key={coord.id} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  {coord.nome}
                                </span>
                              ))}
                              {user.coordenacoes.length > 2 && (
                                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                  +{user.coordenacoes.length - 2}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : user.coordenacaoNome ? (
                          /* Fallback para formato legado */
                          <div className="flex items-center">
                            <FaBuilding className="text-gray-400 mr-2" />
                            <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                              {user.coordenacaoNome}
                            </span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Sem coordenação</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.tipoColaborador ? (
                          <div className="flex items-center">
                            {getTipoIcon(user.tipoColaborador)}
                            <span className="ml-2 capitalize">{user.tipoColaborador}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Não definido</span>
                        )}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-wrap gap-1">
                          {user.niveisHierarquicos.map((nivel) => (
                            <span
                              key={nivel}
                              className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {nivel}
                            </span>
                          ))}
                        </div>
                      </td>
                      
                      {isAdmin && (
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleUserAction(user, 'coordenacao')}
                              className="text-blue-600 hover:text-blue-900 transition-colors"
                              title="Gerenciar Coordenação"
                            >
                              <FaBuilding />
                            </button>
                            <button
                              onClick={() => handleUserAction(user, 'tipo')}
                              className="text-green-600 hover:text-green-900 transition-colors"
                              title="Definir Tipo"
                            >
                              <FaUserTag />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {showModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                {modalAction === 'coordenacao' ? <FaBuilding className="text-white text-2xl" /> : <FaUserTag className="text-white text-2xl" />}
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                {modalAction === 'coordenacao' ? 'Gerenciar Coordenação' : 'Definir Tipo de Colaborador'}
              </h2>
              <p className="text-gray-600">
                {selectedUser.nome}
              </p>
            </div>

            <div className="mb-6">
              {modalAction === 'coordenacao' ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Coordenações:
                  </label>
                  <div className="space-y-3">
                    {/* Coordenações atuais do usuário */}
                    {selectedUser?.coordenacoes && selectedUser.coordenacoes.length > 0 && (
                      <div className="mb-3">
                        <div className="text-sm font-medium text-gray-700 mb-2">Coordenações atuais:</div>
                        <div className="flex flex-wrap gap-2">
                          {selectedUser.coordenacoes.map(coord => (
                            <div key={coord.id} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                              {coord.nome}
                              <button
                                onClick={async () => {
                                  try {
                                    setIsSubmitting(true)
                                    const response = await fetch('/api/admin/usuarios-coordenacoes', {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      credentials: 'include',
                                      body: JSON.stringify({
                                        acao: 'remover-coordenacao',
                                        emailUsuario: selectedUser.email,
                                        coordenacaoId: coord.id
                                      })
                                    })
                                    const data = await response.json()
                                    if (data.success) {
                                      await loadData()
                                      alert('Coordenação removida com sucesso!')
                                    } else {
                                      alert(`Erro: ${data.error}`)
                                    }
                                  } catch (error) {
                                    console.error('Erro ao remover coordenação:', error)
                                    alert('Erro ao remover coordenação')
                                  } finally {
                                    setIsSubmitting(false)
                                  }
                                }}
                                className="text-blue-600 hover:text-blue-800 ml-1"
                                title="Remover coordenação"
                                disabled={isSubmitting}
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Adicionar nova coordenação */}
                    <div>
                      <div className="text-sm font-medium text-gray-700 mb-2">Adicionar coordenação:</div>
                      <select
                        value={selectedCoordenacao}
                        onChange={(e) => setSelectedCoordenacao(e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                      >
                        <option value="" className="text-gray-500">Selecione uma coordenação</option>
                        {coordenacoes
                          .filter(coord => !selectedUser?.coordenacoes?.some(userCoord => userCoord.id === coord.id))
                          .map(coord => (
                            <option key={coord.id} value={coord.id} className="text-gray-900">{coord.nome}</option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Tipo de Colaborador:
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tipo"
                        value="docente"
                        checked={selectedTipo === 'docente'}
                        onChange={(e) => setSelectedTipo(e.target.value as TipoColaborador)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <FaGraduationCap className="mr-2 text-blue-600" />
                        Docente
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="tipo"
                        value="administrativo"
                        checked={selectedTipo === 'administrativo'}
                        onChange={(e) => setSelectedTipo(e.target.value as TipoColaborador)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                      />
                      <span className="ml-2 text-sm text-gray-700 flex items-center">
                        <FaBriefcase className="mr-2 text-gray-600" />
                        Administrativo
                      </span>
                    </label>
                  </div>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitAction}
                disabled={isSubmitting}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <FaSpinner className="animate-spin" />
                    <span>Salvando...</span>
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