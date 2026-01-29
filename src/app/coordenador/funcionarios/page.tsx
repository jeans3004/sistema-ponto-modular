'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { Usuario, TipoColaborador } from '@/types/usuario'
import { 
  FaUsers, 
  FaSpinner, 
  FaUser, 
  FaFilter,
  FaSearch,
  FaExclamationTriangle,
  FaHome,
  FaGraduationCap,
  FaBriefcase,
  FaBuilding,
  FaInfoCircle
} from 'react-icons/fa'

export default function CoordenadorFuncionarios() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Estados de filtro
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [filterStatus, setFilterStatus] = useState<string>('todos')

  // Verificar acesso
  useEffect(() => {
    if (!isLoadingUser && usuario) {
      const isCoordenador = usuario.niveisHierarquicos.includes('coordenador')
      
      if (!isCoordenador) {
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

      // Carregar usuários da coordenação
      const usuariosResponse = await fetch('/api/admin/usuarios-coordenacoes')
      const usuariosData = await usuariosResponse.json()

      if (usuariosData.success) {
        setUsuarios(usuariosData.usuarios)
      } else {
        setError(usuariosData.error || 'Erro ao carregar dados')
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error)
      setError('Erro ao carregar dados')
    } finally {
      setIsLoading(false)
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
    
    if (filterTipo !== 'todos') {
      if (filterTipo === 'sem-tipo') {
        if (user.tipoColaborador) return false
      } else {
        if (user.tipoColaborador !== filterTipo) return false
      }
    }
    
    return true
  })

  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando funcionários...</p>
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
              <span className="text-white font-medium">Funcionários da Coordenação</span>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-center">
              <div className="text-center lg:text-left mb-4 lg:mb-0">
                <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
                  <FaUsers className="mr-3 text-blue-300" />
                  Funcionários da Coordenação
                </h1>
                <p className="text-blue-200 text-lg">
                  Visualize os funcionários sob sua coordenação
                </p>
                {/* Mostrar coordenações do usuário */}
                {usuario.coordenacoes && usuario.coordenacoes.length > 0 ? (
                  <div className="flex items-center mt-2 flex-wrap gap-2">
                    <FaBuilding className="text-blue-300 mr-2" />
                    {usuario.coordenacoes.map((coord, index) => (
                      <span key={coord.id} className="text-blue-200 font-medium bg-blue-800/30 px-2 py-1 rounded-md">
                        {coord.nome}
                      </span>
                    ))}
                  </div>
                ) : usuario.coordenacaoNome ? (
                  /* Fallback para formato legado */
                  <div className="flex items-center mt-2">
                    <FaBuilding className="text-blue-300 mr-2" />
                    <span className="text-blue-200 font-medium bg-blue-800/30 px-2 py-1 rounded-md">{usuario.coordenacaoNome}</span>
                  </div>
                ) : (
                  <div className="flex items-center mt-2">
                    <FaInfoCircle className="text-yellow-300 mr-2" />
                    <span className="text-yellow-200 text-sm">Nenhuma coordenação atribuída</span>
                  </div>
                )}
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

        {/* Aviso se não tem coordenação */}
        {!usuario.coordenacaoId && !usuario.coordenacoes?.length && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <FaInfoCircle className="text-yellow-600 text-2xl mr-4" />
              <div>
                <h3 className="text-yellow-800 font-bold text-lg">Coordenação não atribuída</h3>
                <p className="text-yellow-700">
                  Você ainda não foi atribuído a uma coordenação. Entre em contato com o administrador para ter acesso aos funcionários.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso explicativo sobre o filtro */}
        {(usuario.coordenacoes?.length || usuario.coordenacaoId) && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
            <div className="flex items-center">
              <FaInfoCircle className="text-blue-600 text-2xl mr-4" />
              <div>
                <h3 className="text-blue-800 font-bold text-lg">Visualização Filtrada</h3>
                <p className="text-blue-700">
                  Como coordenador, você visualiza apenas os funcionários das coordenações atribuídas a você. 
                  Para gerenciar todos os funcionários, é necessário ter nível de administrador.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Aviso especial para coordenadores sem coordenação */}
        {!usuario.coordenacaoId && !usuario.coordenacoes?.length && (
          <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-8 mb-8">
            <div className="text-center">
              <FaExclamationTriangle className="text-orange-600 text-4xl mx-auto mb-4" />
              <h3 className="text-orange-800 font-bold text-2xl mb-4">Acesso Restrito</h3>
              <p className="text-orange-700 text-lg mb-4">
                Você não possui nenhuma coordenação atribuída e por isso não pode visualizar funcionários.
              </p>
              <div className="bg-orange-100 rounded-lg p-4 text-left">
                <h4 className="text-orange-800 font-semibold mb-2">Para ter acesso aos funcionários:</h4>
                <ol className="text-orange-700 text-sm space-y-1 list-decimal list-inside">
                  <li>Entre em contato com um administrador do sistema</li>
                  <li>Solicite a atribuição de uma coordenação</li>
                  <li>Após a atribuição, você poderá visualizar e gerenciar os funcionários da sua coordenação</li>
                </ol>
              </div>
            </div>
          </div>
        )}

        {/* Filtros */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
              Funcionários da sua coordenação • {filteredUsuarios.length} encontrados
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
                {searchTerm ? 'Tente ajustar os filtros de busca.' : 
                 !usuario.coordenacaoId && !usuario.coordenacoes?.length ? 
                 'Você não possui coordenação atribuída. Entre em contato com o administrador.' :
                 'Não há funcionários nas suas coordenações.'}
              </p>
              {!usuario.coordenacaoId && !usuario.coordenacoes?.length && (
                <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-center">
                    <FaInfoCircle className="text-yellow-600 mr-2" />
                    <span className="text-yellow-800 text-sm">
                      Coordenadores precisam ter uma coordenação atribuída para visualizar funcionários
                    </span>
                  </div>
                </div>
              )}
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
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Níveis
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Horário
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
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {user.configuracoes?.horarioTrabalho ? (
                          <div className="text-xs">
                            <div>{user.configuracoes.horarioTrabalho.entrada} - {user.configuracoes.horarioTrabalho.saida}</div>
                            <div className="text-gray-500">
                              Almoço: {user.configuracoes.horarioTrabalho.inicioAlmoco} - {user.configuracoes.horarioTrabalho.fimAlmoco}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic">Não definido</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}