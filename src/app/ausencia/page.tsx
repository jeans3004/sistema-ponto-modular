'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { 
  FaFileAlt, 
  FaUpload, 
  FaExternalLinkAlt, 
  FaCheckCircle, 
  FaClock, 
  FaTimesCircle,
  FaArrowLeft,
  FaCalendarAlt,
  FaClipboardList,
  FaLink,
  FaExclamationTriangle,
  FaArrowDown
} from 'react-icons/fa'
import { SYSTEM_CONFIG } from '@/lib/config'

interface AusenciaJustificada {
  id: string
  funcionarioEmail: string
  data: string
  tipo: 'falta' | 'atestado' | 'licenca'
  justificativa: string
  linkDocumento?: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  dataEnvio: string
  dataAnalise?: string
}

export default function AusenciaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  
  const [ausencias, setAusencias] = useState<AusenciaJustificada[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  // Estados do formulário
  const [formData, setFormData] = useState({
    data: '',
    tipo: 'falta' as 'falta' | 'atestado' | 'licenca',
    justificativa: '',
    linkDocumento: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [previewLink, setPreviewLink] = useState('')
  const [linkTransferred, setLinkTransferred] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.email) {
      loadAusencias()
    }
  }, [session])

  const loadAusencias = async () => {
    try {
      const response = await fetch('/api/ausencia')
      const data = await response.json()
      
      if (data.success) {
        setAusencias(data.ausencias || [])
      }
    } catch (error) {
      console.error('Erro ao carregar ausências:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.data || !formData.justificativa) {
      alert('Por favor, preencha todos os campos obrigatórios')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/ausencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })
      
      const data = await response.json()
      
      if (data.success) {
        alert('Ausência registrada com sucesso!')
        setFormData({
          data: '',
          tipo: 'falta',
          justificativa: '',
          linkDocumento: ''
        })
        setShowForm(false)
        await loadAusencias()
      } else {
        alert(data.error || 'Erro ao registrar ausência')
      }
    } catch (error) {
      console.error('Erro ao registrar ausência:', error)
      alert('Erro ao registrar ausência')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR')
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'aprovada':
        return <FaCheckCircle className="text-green-500" />
      case 'rejeitada':
        return <FaTimesCircle className="text-red-500" />
      default:
        return <FaClock className="text-yellow-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aprovada':
        return 'Aprovada'
      case 'rejeitada':
        return 'Rejeitada'
      default:
        return 'Pendente'
    }
  }

  const getTipoText = (tipo: string) => {
    switch (tipo) {
      case 'atestado':
        return 'Atestado Médico'
      case 'licenca':
        return 'Licença'
      default:
        return 'Falta'
    }
  }

  const processGoogleDriveLink = (link: string) => {
    if (!link) return { isValid: false, previewUrl: '', downloadUrl: '' }
    
    // Extrair ID do Google Drive de diferentes formatos de URL
    const patterns = [
      /\/file\/d\/([a-zA-Z0-9-_]+)/,
      /id=([a-zA-Z0-9-_]+)/,
      /\/d\/([a-zA-Z0-9-_]+)/
    ]
    
    let fileId = ''
    for (const pattern of patterns) {
      const match = link.match(pattern)
      if (match) {
        fileId = match[1]
        break
      }
    }
    
    if (!fileId) {
      return { isValid: false, previewUrl: '', downloadUrl: '' }
    }
    
    return {
      isValid: true,
      previewUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/file/d/${fileId}/view`,
      fileId
    }
  }

  const handlePreviewLinkChange = (link: string) => {
    setPreviewLink(link)
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-6"></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6 border border-white/20">
            <p className="text-white text-lg">Carregando dados...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 md:p-6 border border-white/20">
            {/* Layout Mobile */}
            <div className="block md:hidden space-y-4">
              <div className="flex items-center justify-between">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-10 h-10 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <FaArrowLeft className="text-white text-lg" />
                </Link>
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300 text-sm"
                >
                  <FaFileAlt className="text-sm" />
                  <span>{showForm ? 'Cancelar' : 'Nova Ausência'}</span>
                </button>
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-white mb-1">
                  Ausências Justificadas
                </h1>
                <p className="text-blue-200 text-sm">
                  Registre faltas, atestados e licenças
                </p>
              </div>
            </div>

            {/* Layout Desktop */}
            <div className="hidden md:flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link
                  href="/dashboard"
                  className="flex items-center justify-center w-12 h-12 bg-white/20 rounded-xl hover:bg-white/30 transition-colors"
                >
                  <FaArrowLeft className="text-white text-xl" />
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-2">
                    Ausências Justificadas
                  </h1>
                  <p className="text-blue-200">
                    Registre faltas, atestados e licenças
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowForm(!showForm)}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 transition-all duration-300 transform hover:scale-105"
              >
                <FaFileAlt />
                <span>{showForm ? 'Cancelar' : 'Nova Ausência'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Instruções Detalhadas */}
        <div className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          {/* Header das Instruções */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-3">
                <FaUpload className="text-white text-2xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold mb-1">
                  Como Enviar Documentos de Justificativa
                </h3>
                <p className="text-blue-100">
                  Siga o passo a passo abaixo para enviar seu atestado ou documento
                </p>
              </div>
            </div>
          </div>

          {/* Passos */}
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Passo 1 */}
              <div className="text-center">
                <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-blue-600 font-bold text-xl">1</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Acesse o Drive</h4>
                <p className="text-gray-600 text-sm">
                  Clique no botão abaixo para abrir a pasta do Google Drive
                </p>
              </div>

              {/* Passo 2 */}
              <div className="text-center">
                <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-green-600 font-bold text-xl">2</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Faça o Upload</h4>
                <p className="text-gray-600 text-sm">
                  Arraste ou selecione seu arquivo (PDF, JPG, PNG)
                </p>
              </div>

              {/* Passo 3 */}
              <div className="text-center">
                <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-orange-600 font-bold text-xl">3</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Copie o Link</h4>
                <p className="text-gray-600 text-sm">
                  Clique com botão direito no arquivo → "Copiar link"
                </p>
              </div>

              {/* Passo 4 */}
              <div className="text-center">
                <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                  <span className="text-purple-600 font-bold text-xl">4</span>
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Cole Aqui</h4>
                <p className="text-gray-600 text-sm">
                  Volte ao formulário e cole o link no campo correspondente
                </p>
              </div>
            </div>

            {/* Botão do Google Drive */}
            <div className="mt-8 text-center">
              {SYSTEM_CONFIG.ABSENCE.GOOGLE_DRIVE_FOLDER_URL ? (
                <a
                  href={SYSTEM_CONFIG.ABSENCE.GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-300 transform hover:scale-105 shadow-lg"
                >
                  <FaExternalLinkAlt className="text-xl" />
                  <span>Abrir Pasta do Google Drive</span>
                </a>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-w-md mx-auto">
                  <div className="flex items-center space-x-2 text-red-600">
                    <FaExclamationTriangle />
                    <span className="font-medium">Link não configurado</span>
                  </div>
                  <p className="text-red-700 text-sm mt-1">
                    Entre em contato com o administrador do sistema para obter o link da pasta do Google Drive.
                  </p>
                </div>
              )}
            </div>

            {/* Dicas Importantes */}
            <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center">
                <FaExclamationTriangle className="mr-2" />
                Dicas Importantes
              </h4>
              <ul className="text-yellow-700 text-sm space-y-1 ml-6">
                <li>• Nomeie o arquivo com seu nome e data (ex: "João_Atestado_2024-01-15.pdf")</li>
                <li>• Certifique-se de que o documento está legível</li>
                <li>• Formatos aceitos: PDF, JPG, PNG (máx. 10MB)</li>
                <li>• O documento será analisado em até 48 horas úteis</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Caixa de Preview do Documento */}
        <div className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl border border-white/20 overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-white/20 rounded-full p-2">
                <FaFileAlt className="text-white text-lg" />
              </div>
              <div>
                <h3 className="text-lg font-bold">
                  Visualizar Documento
                </h3>
                <p className="text-green-100 text-sm">
                  Cole o link do seu documento para visualizar antes de enviar
                </p>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Link do Google Drive
                </label>
                <div className="relative">
                  <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                  <input
                    type="url"
                    value={previewLink}
                    onChange={(e) => handlePreviewLinkChange(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="Cole aqui o link do Google Drive para visualizar..."
                  />
                </div>
              </div>

              {/* Preview do Documento */}
              {previewLink && (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  {(() => {
                    const linkInfo = processGoogleDriveLink(previewLink)
                    
                    if (!linkInfo.isValid) {
                      return (
                        <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                          <div className="flex items-center space-x-2 text-red-700">
                            <FaExclamationTriangle />
                            <span className="font-semibold">Link inválido</span>
                          </div>
                          <p className="text-red-800 text-sm mt-1 font-medium">
                            Por favor, verifique se o link do Google Drive está correto.
                          </p>
                        </div>
                      )
                    }

                    return (
                      <div>
                        <div className="bg-gray-100 p-4 border-b border-gray-300 flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <FaCheckCircle className="text-green-600" />
                            <span className="font-semibold text-gray-900">Preview do Documento</span>
                          </div>
                          <a
                            href={linkInfo.downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-700 hover:text-blue-900 text-sm font-medium flex items-center space-x-1"
                          >
                            <FaExternalLinkAlt />
                            <span>Abrir no Drive</span>
                          </a>
                        </div>
                        <div className="relative" style={{ paddingBottom: '60%' }}>
                          <iframe
                            src={linkInfo.previewUrl}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            title="Preview do documento"
                          />
                        </div>
                        <div className="bg-green-50 p-4 border-t border-gray-300">
                          <div className="flex items-center space-x-2 text-green-700">
                            <FaCheckCircle />
                            <span className="font-semibold text-sm">Documento carregado com sucesso!</span>
                          </div>
                          <p className="text-green-800 text-sm mt-1 font-medium">
                            Você pode usar este link no formulário abaixo.
                          </p>
                          <button
                            onClick={() => {
                              setFormData({ ...formData, linkDocumento: previewLink })
                              setShowForm(true)
                              setLinkTransferred(true)
                              
                              // Scroll para o formulário
                              setTimeout(() => {
                                const formulario = document.getElementById('formulario-ausencia')
                                if (formulario) {
                                  formulario.scrollIntoView({ behavior: 'smooth' })
                                }
                              }, 100)
                              
                              // Resetar feedback após 3 segundos
                              setTimeout(() => {
                                setLinkTransferred(false)
                              }, 3000)
                            }}
                            className={`mt-2 px-4 py-2 rounded-lg text-sm transition-all duration-300 flex items-center space-x-2 ${
                              linkTransferred 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {linkTransferred ? (
                              <>
                                <FaCheckCircle className="text-sm" />
                                <span>Link transferido!</span>
                              </>
                            ) : (
                              <>
                                <FaArrowDown className="text-sm" />
                                <span>Usar este link no formulário</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              )}

              {!previewLink && (
                <div className="bg-gray-50 border-2 border-dashed border-gray-400 rounded-lg p-8 text-center">
                  <FaUpload className="text-gray-600 text-3xl mx-auto mb-3" />
                  <p className="text-gray-800 font-semibold mb-1">
                    Cole o link do seu documento acima
                  </p>
                  <p className="text-gray-600 text-sm">
                    O preview aparecerá aqui automaticamente
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulário */}
        {showForm && (
          <div id="formulario-ausencia" className="mb-8 bg-white/95 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Registrar Nova Ausência
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Data da Ausência *
                  </label>
                  <div className="relative">
                    <FaCalendarAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                    <input
                      type="date"
                      value={formData.data}
                      onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-2">
                    Tipo de Ausência *
                  </label>
                  <select
                    value={formData.tipo}
                    onChange={(e) => setFormData({ ...formData, tipo: e.target.value as any })}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium bg-white"
                    required
                  >
                    <option value="falta">Falta</option>
                    <option value="atestado">Atestado Médico</option>
                    <option value="licenca">Licença</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Justificativa *
                </label>
                <div className="relative">
                  <FaClipboardList className="absolute left-3 top-3 text-gray-600" />
                  <textarea
                    value={formData.justificativa}
                    onChange={(e) => setFormData({ ...formData, justificativa: e.target.value })}
                    rows={4}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="Descreva o motivo da ausência..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Link do Documento (Opcional)
                </label>
                <div className="relative">
                  <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                  <input
                    type="url"
                    value={formData.linkDocumento}
                    onChange={(e) => setFormData({ ...formData, linkDocumento: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="https://drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/view?usp=sharing"
                  />
                </div>
                <div className="flex items-start space-x-2 mt-2">
                  <div className="bg-blue-50 border border-blue-300 rounded-lg p-3 flex-1">
                    <div className="flex items-center space-x-2 text-blue-700 mb-1">
                      <FaExternalLinkAlt className="text-sm" />
                      <span className="font-bold text-sm">Como obter o link:</span>
                    </div>
                    <p className="text-blue-800 text-sm font-medium">
                      1. Faça upload no Google Drive usando o botão acima<br />
                      2. Clique com botão direito no arquivo<br />
                      3. Selecione "Copiar link" e cole aqui
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-6 py-3 border-2 border-gray-300 text-gray-800 font-semibold rounded-lg hover:bg-gray-100 hover:border-gray-400 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                >
                  {isSubmitting ? 'Enviando...' : 'Registrar Ausência'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Lista de Ausências */}
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              Histórico de Ausências
            </h2>
          </div>
          
          <div className="p-6">
            {ausencias.length === 0 ? (
              <div className="text-center py-12">
                <FaFileAlt className="text-gray-400 text-4xl mx-auto mb-4" />
                <p className="text-gray-500 text-lg">
                  Nenhuma ausência registrada
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {ausencias.map((ausencia) => (
                  <div
                    key={ausencia.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-gray-900 text-lg">
                            {getTipoText(ausencia.tipo)}
                          </h3>
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                            {formatDate(ausencia.data)}
                          </span>
                        </div>
                        
                        <p className="text-gray-700 mb-3">
                          {ausencia.justificativa}
                        </p>
                        
                        {ausencia.linkDocumento && (
                          <div className="mb-3">
                            <a
                              href={ausencia.linkDocumento}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors"
                            >
                              <FaExternalLinkAlt className="text-sm" />
                              <span>Ver Documento</span>
                            </a>
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-500">
                          Enviado em: {formatDate(ausencia.dataEnvio)}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2 ml-4">
                        {getStatusIcon(ausencia.status)}
                        <span className={`font-medium ${
                          ausencia.status === 'aprovada' ? 'text-green-700' :
                          ausencia.status === 'rejeitada' ? 'text-red-700' :
                          'text-yellow-700'
                        }`}>
                          {getStatusText(ausencia.status)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}