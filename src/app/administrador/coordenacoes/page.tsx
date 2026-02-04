'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaPlus, 
  FaEdit, 
  FaTrash, 
  FaUserPlus, 
  FaUserMinus,
  FaSpinner,
  FaBuilding,
  FaUser,
  FaCheck,
  FaTimes,
  FaToggleOn,
  FaToggleOff,
  FaArrowLeft
} from 'react-icons/fa'

interface CoordenadorInfo {
  email: string
  nome: string
}

interface Coordenacao {
  id: string
  nome: string
  descricao: string
  coordenadores?: CoordenadorInfo[]
  // Campos legados
  coordenadorEmail?: string
  coordenadorNome?: string
  ativo: boolean
  createdAt: any
  updatedAt: any
  createdBy: string
}

interface Usuario {
  id: string
  email: string
  nome: string
  niveisHierarquicos: string[]
  status: string
}

export default function GerenciamentoCoordenacoes() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  
  const [coordenacoes, setCoordenacoes] = useState<Coordenacao[]>([])
  const [coordenadores, setCoordenadores] = useState<Usuario[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Estados para modais
  const [showCriarModal, setShowCriarModal] = useState(false)
  const [showEditarModal, setShowEditarModal] = useState(false)
  const [showAtribuirModal, setShowAtribuirModal] = useState(false)
  const [showAtribuirLoteModal, setShowAtribuirLoteModal] = useState(false)
  const [selectedCoordenacao, setSelectedCoordenacao] = useState<Coordenacao | null>(null)

  // Estados para formulários
  const [formData, setFormData] = useState({
    nome: '',
    descricao: ''
  })
  const [selectedCoordenador, setSelectedCoordenador] = useState('')

  // Estados para atribuição em lote
  const [selectedCoordenadorLote, setSelectedCoordenadorLote] = useState('')
  const [coordenacoesSelecionadas, setCoordenacoesSelecionadas] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!isLoadingUser && usuario && !usuario.niveisHierarquicos.includes('administrador')) {
      router.push('/dashboard')
      return
    }
  }, [usuario, isLoadingUser, router])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      loadData()
    }
  }, [session])

  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Carregar coordenações
      const coordenacoesResponse = await fetch('/api/admin/coordenacoes')
      const coordenacoesData = await coordenacoesResponse.json()
      
      if (coordenacoesData.success) {
        setCoordenacoes(coordenacoesData.coordenacoes)
      }
      
      // Carregar usuários coordenadores
      const usuariosResponse = await fetch('/api/admin/usuarios')
      const usuariosData = await usuariosResponse.json()
      
      if (usuariosData.success) {
        const coordenadores = usuariosData.usuarios.filter((u: Usuario) => 
          u.niveisHierarquicos.includes('coordenador') && u.status === 'ativo'
        )
        setCoordenadores(coordenadores)
      }
      
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmitCriar = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'criar',
          nome: formData.nome,
          descricao: formData.descricao
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Coordenação criada com sucesso!')
        setShowCriarModal(false)
        setFormData({ nome: '', descricao: '' })
        await loadData()
      } else {
        alert(data.error || 'Erro ao criar coordenação')
      }
    } catch (error) {
      console.error('Erro ao criar coordenação:', error)
      alert('Erro ao criar coordenação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSubmitEditar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCoordenacao) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atualizar',
          coordenacaoId: selectedCoordenacao.id,
          nome: formData.nome,
          descricao: formData.descricao
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Coordenação atualizada com sucesso!')
        setShowEditarModal(false)
        setSelectedCoordenacao(null)
        setFormData({ nome: '', descricao: '' })
        await loadData()
      } else {
        alert(data.error || 'Erro ao atualizar coordenação')
      }
    } catch (error) {
      console.error('Erro ao atualizar coordenação:', error)
      alert('Erro ao atualizar coordenação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAtribuirCoordenador = async () => {
    if (!selectedCoordenacao || !selectedCoordenador) return
    
    setIsSubmitting(true)
    
    try {
      const coordenador = coordenadores.find(c => c.email === selectedCoordenador)
      if (!coordenador) return
      
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'atribuir-coordenador',
          coordenacaoId: selectedCoordenacao.id,
          coordenadorEmail: coordenador.email,
          coordenadorNome: coordenador.nome
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Coordenador atribuído com sucesso!')
        setShowAtribuirModal(false)
        setSelectedCoordenacao(null)
        setSelectedCoordenador('')
        await loadData()
      } else {
        alert(data.error || 'Erro ao atribuir coordenador')
      }
    } catch (error) {
      console.error('Erro ao atribuir coordenador:', error)
      alert('Erro ao atribuir coordenador')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoverCoordenador = async (coordenacao: Coordenacao, coordenadorEmail?: string) => {
    const mensagem = coordenadorEmail
      ? `Deseja realmente remover este coordenador da coordenação "${coordenacao.nome}"?`
      : `Deseja realmente remover TODOS os coordenadores da coordenação "${coordenacao.nome}"?`

    if (!confirm(mensagem)) return

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: coordenadorEmail ? 'remover-coordenador-especifico' : 'remover-coordenador',
          coordenacaoId: coordenacao.id,
          coordenadorEmail: coordenadorEmail
        })
      })

      const data = await response.json()

      if (data.success) {
        alert('Coordenador removido com sucesso!')
        await loadData()
      } else {
        alert(data.error || 'Erro ao remover coordenador')
      }
    } catch (error) {
      console.error('Erro ao remover coordenador:', error)
      alert('Erro ao remover coordenador')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Função auxiliar para obter a lista de coordenadores (novo array ou campo legado)
  const getCoordenadoresDaCoordenacao = (coordenacao: Coordenacao): CoordenadorInfo[] => {
    if (coordenacao.coordenadores && coordenacao.coordenadores.length > 0) {
      return coordenacao.coordenadores
    }
    if (coordenacao.coordenadorEmail && coordenacao.coordenadorNome) {
      return [{ email: coordenacao.coordenadorEmail, nome: coordenacao.coordenadorNome }]
    }
    return []
  }

  const handleToggleAtivo = async (coordenacao: Coordenacao) => {
    const novoStatus = !coordenacao.ativo
    const acao = novoStatus ? 'ativar' : 'inativar'
    
    if (!confirm(`Deseja realmente ${acao} esta coordenação?`)) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'ativar-inativar',
          coordenacaoId: coordenacao.id,
          ativo: novoStatus
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert(`Coordenação ${acao}da com sucesso!`)
        await loadData()
      } else {
        alert(data.error || `Erro ao ${acao} coordenação`)
      }
    } catch (error) {
      console.error(`Erro ao ${acao} coordenação:`, error)
      alert(`Erro ao ${acao} coordenação`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleExcluir = async (coordenacao: Coordenacao) => {
    if (!confirm('Deseja realmente excluir esta coordenação? Esta ação não pode ser desfeita.')) return
    
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/admin/coordenacoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          acao: 'excluir',
          coordenacaoId: coordenacao.id
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Coordenação excluída com sucesso!')
        await loadData()
      } else {
        alert(data.error || 'Erro ao excluir coordenação')
      }
    } catch (error) {
      console.error('Erro ao excluir coordenação:', error)
      alert('Erro ao excluir coordenação')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSelectCoordenadorLote = (email: string) => {
    setSelectedCoordenadorLote(email)
    if (!email) {
      setCoordenacoesSelecionadas(new Set())
      return
    }
    const preSelected = new Set<string>()
    coordenacoes.forEach((c) => {
      if (c.ativo) {
        const coordenadoresList = getCoordenadoresDaCoordenacao(c)
        if (coordenadoresList.some(coord => coord.email === email)) {
          preSelected.add(c.id)
        }
      }
    })
    setCoordenacoesSelecionadas(preSelected)
  }

  const toggleCoordenacaoLote = (id: string) => {
    setCoordenacoesSelecionadas((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleAtribuirLote = async () => {
    if (!selectedCoordenadorLote) return

    const coordenador = coordenadores.find(c => c.email === selectedCoordenadorLote)
    if (!coordenador) return

    setIsSubmitting(true)

    try {
      const coordenacoesAtivas = coordenacoes.filter(c => c.ativo)
      const promises: Promise<Response>[] = []

      for (const coord of coordenacoesAtivas) {
        const estaSelecionada = coordenacoesSelecionadas.has(coord.id)
        const coordenadoresList = getCoordenadoresDaCoordenacao(coord)
        const jaAtribuida = coordenadoresList.some(c => c.email === selectedCoordenadorLote)

        if (estaSelecionada && !jaAtribuida) {
          // Adicionar coordenador
          promises.push(
            fetch('/api/admin/coordenacoes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                acao: 'adicionar-coordenador',
                coordenacaoId: coord.id,
                coordenadorEmail: coordenador.email,
                coordenadorNome: coordenador.nome
              })
            })
          )
        } else if (!estaSelecionada && jaAtribuida) {
          // Remover coordenador específico
          promises.push(
            fetch('/api/admin/coordenacoes', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                acao: 'remover-coordenador-especifico',
                coordenacaoId: coord.id,
                coordenadorEmail: selectedCoordenadorLote
              })
            })
          )
        }
      }

      if (promises.length === 0) {
        alert('Nenhuma alteração detectada.')
        setIsSubmitting(false)
        return
      }

      const results = await Promise.all(promises)
      const allData = await Promise.all(results.map(r => r.json()))
      const erros = allData.filter(d => !d.success)

      if (erros.length > 0) {
        alert(`Concluído com ${erros.length} erro(s). Verifique os dados.`)
      } else {
        alert('Coordenações atualizadas com sucesso!')
      }

      setShowAtribuirLoteModal(false)
      setSelectedCoordenadorLote('')
      setCoordenacoesSelecionadas(new Set())
      await loadData()
    } catch (error) {
      console.error('Erro ao atribuir em lote:', error)
      alert('Erro ao atribuir coordenações em lote')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEditarModal = (coordenacao: Coordenacao) => {
    setSelectedCoordenacao(coordenacao)
    setFormData({
      nome: coordenacao.nome,
      descricao: coordenacao.descricao
    })
    setShowEditarModal(true)
  }

  const openAtribuirModal = (coordenacao: Coordenacao) => {
    setSelectedCoordenacao(coordenacao)
    setSelectedCoordenador(coordenacao.coordenadorEmail || '')
    setShowAtribuirModal(true)
  }

  if (status === 'loading' || isLoading || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando coordenações...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-pink-900 relative overflow-hidden">
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
                <div className="flex items-center mb-2">
                  <button
                    onClick={() => router.push('/administrador/dashboard')}
                    className="mr-4 text-white hover:text-red-200 transition-colors"
                  >
                    <FaArrowLeft className="text-xl" />
                  </button>
                  <h1 className="text-3xl font-bold text-white">
                    Gerenciamento de Coordenações
                  </h1>
                </div>
                <p className="text-red-200 text-lg">
                  Gerencie coordenações e atribua coordenadores
                </p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => {
                    setSelectedCoordenadorLote('')
                    setCoordenacoesSelecionadas(new Set())
                    setShowAtribuirLoteModal(true)
                  }}
                  className="flex items-center space-x-2 bg-purple-600/80 hover:bg-purple-600 text-white px-6 py-3 rounded-xl transition-all duration-200 border border-purple-400/30"
                >
                  <FaUserPlus />
                  <span>Atribuir Coordenações</span>
                </button>
                <button
                  onClick={() => setShowCriarModal(true)}
                  className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 text-white px-6 py-3 rounded-xl transition-all duration-200 border border-white/30"
                >
                  <FaPlus />
                  <span>Nova Coordenação</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Coordenações */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Coordenações Cadastradas</h2>
            <p className="text-gray-600 mt-2">Total: {coordenacoes.length} coordenações</p>
          </div>
          
          {coordenacoes.length === 0 ? (
            <div className="text-center py-12">
              <FaBuilding className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhuma coordenação encontrada</h3>
              <p className="mt-1 text-sm text-gray-500">
                Comece criando uma nova coordenação.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordenação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Coordenador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data Criação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {coordenacoes.map((coordenacao) => (
                    <tr key={coordenacao.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {coordenacao.nome}
                          </div>
                          <div className="text-sm text-gray-500">
                            {coordenacao.descricao}
                          </div>
                        </div>
                      </td>
                      
                      <td className="px-6 py-4">
                        {(() => {
                          const coordenadoresList = getCoordenadoresDaCoordenacao(coordenacao)
                          if (coordenadoresList.length === 0) {
                            return <span className="text-sm text-gray-500 italic">Não atribuído</span>
                          }
                          return (
                            <div className="space-y-2">
                              {coordenadoresList.map((coord, idx) => (
                                <div key={coord.email} className="flex items-center group">
                                  <div className="h-7 w-7 bg-blue-600 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
                                    <FaUser className="text-white text-xs" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-medium text-gray-900 truncate">
                                      {coord.nome}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate">
                                      {coord.email}
                                    </div>
                                  </div>
                                  <button
                                    onClick={() => handleRemoverCoordenador(coordenacao, coord.email)}
                                    className="ml-2 opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1 transition-opacity"
                                    title={`Remover ${coord.nome}`}
                                  >
                                    <FaTimes className="text-xs" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )
                        })()}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          coordenacao.ativo 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {coordenacao.ativo ? 'Ativa' : 'Inativa'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          if (!coordenacao.createdAt) return 'N/A'
                          
                          try {
                            let date
                            
                            // Firebase Timestamp format
                            if (coordenacao.createdAt && typeof coordenacao.createdAt === 'object') {
                              if ('seconds' in coordenacao.createdAt) {
                                date = new Date(coordenacao.createdAt.seconds * 1000)
                              } else if ('toDate' in coordenacao.createdAt && typeof coordenacao.createdAt.toDate === 'function') {
                                date = coordenacao.createdAt.toDate()
                              } else if ('_seconds' in coordenacao.createdAt) {
                                date = new Date(coordenacao.createdAt._seconds * 1000)
                              } else {
                                date = new Date(coordenacao.createdAt)
                              }
                            } else if (typeof coordenacao.createdAt === 'string') {
                              date = new Date(coordenacao.createdAt)
                            } else {
                              date = new Date(coordenacao.createdAt)
                            }
                            
                            if (isNaN(date.getTime())) {
                              return 'N/A'
                            }
                            
                            return date.toLocaleDateString('pt-BR')
                          } catch (error) {
                            console.error('Erro ao formatar data da coordenação:', coordenacao.id, error)
                            return 'N/A'
                          }
                        })()}
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => openEditarModal(coordenacao)}
                            className="inline-flex items-center px-2 py-1 border border-blue-300 text-blue-700 rounded text-xs hover:bg-blue-50 transition-colors"
                          >
                            <FaEdit className="mr-1" />
                            Editar
                          </button>
                          
                          <button
                            onClick={() => openAtribuirModal(coordenacao)}
                            className="inline-flex items-center px-2 py-1 border border-purple-300 text-purple-700 rounded text-xs hover:bg-purple-50 transition-colors"
                          >
                            <FaUserPlus className="mr-1" />
                            Adicionar
                          </button>

                          {getCoordenadoresDaCoordenacao(coordenacao).length > 0 && (
                            <button
                              onClick={() => handleRemoverCoordenador(coordenacao)}
                              className="inline-flex items-center px-2 py-1 border border-orange-300 text-orange-700 rounded text-xs hover:bg-orange-50 transition-colors"
                              title="Remover todos os coordenadores"
                            >
                              <FaUserMinus className="mr-1" />
                              Limpar
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleToggleAtivo(coordenacao)}
                            className={`inline-flex items-center px-2 py-1 border rounded text-xs transition-colors ${
                              coordenacao.ativo 
                                ? 'border-red-300 text-red-700 hover:bg-red-50' 
                                : 'border-green-300 text-green-700 hover:bg-green-50'
                            }`}
                          >
                            {coordenacao.ativo ? <FaToggleOff className="mr-1" /> : <FaToggleOn className="mr-1" />}
                            {coordenacao.ativo ? 'Inativar' : 'Ativar'}
                          </button>
                          
                          <button
                            onClick={() => handleExcluir(coordenacao)}
                            className="inline-flex items-center px-2 py-1 border border-red-300 text-red-700 rounded text-xs hover:bg-red-50 transition-colors"
                          >
                            <FaTrash className="mr-1" />
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal Criar Coordenação */}
      {showCriarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaBuilding className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Nova Coordenação</h2>
            </div>

            <form onSubmit={handleSubmitCriar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Coordenação
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Digite o nome da coordenação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Descreva o objetivo desta coordenação"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCriarModal(false)
                    setFormData({ nome: '', descricao: '' })
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Criando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Criar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar Coordenação */}
      {showEditarModal && selectedCoordenacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaEdit className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Editar Coordenação</h2>
            </div>

            <form onSubmit={handleSubmitEditar} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Coordenação
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Digite o nome da coordenação"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.descricao}
                  onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white placeholder-gray-500"
                  placeholder="Descreva o objetivo desta coordenação"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditarModal(false)
                    setSelectedCoordenacao(null)
                    setFormData({ nome: '', descricao: '' })
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
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
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Coordenador */}
      {showAtribuirModal && selectedCoordenacao && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserPlus className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Adicionar Coordenador
              </h2>
              <p className="text-gray-600">{selectedCoordenacao.nome}</p>
            </div>

            {/* Coordenadores atuais */}
            {(() => {
              const atuais = getCoordenadoresDaCoordenacao(selectedCoordenacao)
              if (atuais.length > 0) {
                return (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700 mb-2">Coordenadores atuais:</p>
                    <div className="space-y-1">
                      {atuais.map(c => (
                        <div key={c.email} className="text-sm text-gray-600 flex items-center">
                          <FaUser className="mr-2 text-gray-400" />
                          {c.nome}
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            })()}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione um coordenador para adicionar
                </label>
                <select
                  value={selectedCoordenador}
                  onChange={(e) => setSelectedCoordenador(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Selecione um coordenador</option>
                  {coordenadores
                    .filter(c => !getCoordenadoresDaCoordenacao(selectedCoordenacao).some(a => a.email === c.email))
                    .map((coordenador) => (
                      <option key={coordenador.email} value={coordenador.email}>
                        {coordenador.nome} ({coordenador.email})
                      </option>
                    ))}
                </select>
                {coordenadores.filter(c => !getCoordenadoresDaCoordenacao(selectedCoordenacao).some(a => a.email === c.email)).length === 0 && (
                  <p className="text-sm text-orange-600 mt-2">
                    Todos os coordenadores disponíveis já foram adicionados.
                  </p>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAtribuirModal(false)
                    setSelectedCoordenacao(null)
                    setSelectedCoordenador('')
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAtribuirCoordenador}
                  disabled={isSubmitting || !selectedCoordenador}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Adicionando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Adicionar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Atribuir Coordenações em Lote */}
      {showAtribuirLoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl max-h-[90vh] flex flex-col">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaUserPlus className="text-white text-2xl" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Atribuir Coordenações em Lote</h2>
              <p className="text-gray-600">Selecione um coordenador e marque as coordenações desejadas</p>
            </div>

            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Selecione o Coordenador
                </label>
                <select
                  value={selectedCoordenadorLote}
                  onChange={(e) => handleSelectCoordenadorLote(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-gray-900 bg-white"
                >
                  <option value="">Selecione um coordenador</option>
                  {coordenadores.map((coordenador) => (
                    <option key={coordenador.email} value={coordenador.email}>
                      {coordenador.nome} ({coordenador.email})
                    </option>
                  ))}
                </select>
              </div>

              {selectedCoordenadorLote && (
                <div className="flex-1 overflow-hidden flex flex-col">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Coordenações Ativas
                  </label>
                  <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                    {coordenacoes.filter(c => c.ativo).length === 0 ? (
                      <p className="text-sm text-gray-500 italic p-4 text-center">Nenhuma coordenação ativa encontrada.</p>
                    ) : (
                      coordenacoes.filter(c => c.ativo).map((coord) => {
                        const isChecked = coordenacoesSelecionadas.has(coord.id)
                        const coordenadoresList = getCoordenadoresDaCoordenacao(coord)
                        const jaTemEsteCoordenador = coordenadoresList.some(c => c.email === selectedCoordenadorLote)
                        const outrosCoordenadores = coordenadoresList.filter(c => c.email !== selectedCoordenadorLote)

                        return (
                          <label
                            key={coord.id}
                            className={`flex items-start gap-3 p-3 cursor-pointer hover:bg-purple-50 transition-colors ${isChecked ? 'bg-purple-50/50' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCoordenacaoLote(coord.id)}
                              className="mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-900">{coord.nome}</div>
                              {coord.descricao && (
                                <div className="text-xs text-gray-500 truncate">{coord.descricao}</div>
                              )}
                              {outrosCoordenadores.length > 0 && (
                                <div className="text-xs text-gray-500 mt-1">
                                  Outros: {outrosCoordenadores.map(c => c.nome).join(', ')}
                                </div>
                              )}
                              {jaTemEsteCoordenador && (
                                <div className="text-xs text-green-600 mt-1">
                                  (Já atribuído a este coordenador)
                                </div>
                              )}
                            </div>
                          </label>
                        )
                      })
                    )}
                  </div>
                </div>
              )}

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAtribuirLoteModal(false)
                    setSelectedCoordenadorLote('')
                    setCoordenacoesSelecionadas(new Set())
                  }}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAtribuirLote}
                  disabled={isSubmitting || !selectedCoordenadorLote}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>Salvando...</span>
                    </>
                  ) : (
                    <>
                      <FaCheck />
                      <span>Salvar</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}