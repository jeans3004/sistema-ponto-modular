'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
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
  FaTimes,
  FaSpinner
} from 'react-icons/fa'

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

  // Estados de upload de arquivo
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle')
  const [uploadMessage, setUploadMessage] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setUploadStatus('idle')
      setUploadMessage('')
    }
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setUploadStatus('idle')
    setUploadMessage('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const uploadFileToGoogleDrive = async (file: File): Promise<string | null> => {
    const uploadFormData = new FormData()
    uploadFormData.append('file', file)

    setIsUploading(true)
    setUploadStatus('uploading')
    setUploadMessage('Enviando arquivo para o Google Drive...')

    try {
      const response = await fetch('/api/drive/upload', {
        method: 'POST',
        body: uploadFormData,
      })

      const data = await response.json()

      if (data.success) {
        setUploadStatus('success')
        setUploadMessage(`Arquivo "${data.fileName}" enviado com sucesso!`)
        return data.webViewLink
      } else {
        setUploadStatus('error')
        setUploadMessage(data.error || 'Erro ao enviar arquivo')
        return null
      }
    } catch (error) {
      console.error('Erro no upload:', error)
      setUploadStatus('error')
      setUploadMessage('Erro de conexão ao enviar arquivo')
      return null
    } finally {
      setIsUploading(false)
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
      let linkDocumento = formData.linkDocumento

      // Se há arquivo selecionado, fazer upload primeiro
      if (selectedFile) {
        const driveLink = await uploadFileToGoogleDrive(selectedFile)
        if (driveLink) {
          linkDocumento = driveLink
        } else {
          // Upload falhou - perguntar se deseja continuar sem o arquivo
          const continuar = confirm(
            'Não foi possível enviar o arquivo para o Google Drive. Deseja registrar a ausência sem o documento anexado?'
          )
          if (!continuar) {
            setIsSubmitting(false)
            return
          }
        }
      }

      const response = await fetch('/api/ausencia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ...formData, linkDocumento })
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
        setSelectedFile(null)
        setUploadStatus('idle')
        setUploadMessage('')
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
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

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
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

              {/* Upload de Documento */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Documento Justificativo (Opcional)
                </label>
                <p className="text-gray-600 text-sm mb-3">
                  Selecione um arquivo para enviar diretamente ao Google Drive, ou cole um link manualmente abaixo.
                </p>

                {/* Área de seleção de arquivo */}
                {!selectedFile ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-400 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all"
                  >
                    <FaUpload className="text-gray-500 text-2xl mx-auto mb-2" />
                    <p className="text-gray-700 font-semibold">
                      Clique para selecionar um arquivo
                    </p>
                    <p className="text-gray-500 text-sm mt-1">
                      PDF, JPG ou PNG (máx. 4MB)
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-green-300 bg-green-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <FaFileAlt className="text-green-600 text-xl" />
                        <div>
                          <p className="text-gray-900 font-semibold text-sm">{selectedFile.name}</p>
                          <p className="text-gray-500 text-xs">{formatFileSize(selectedFile.size)}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemoveFile}
                        disabled={isUploading}
                        className="text-red-500 hover:text-red-700 p-1 disabled:opacity-50"
                        title="Remover arquivo"
                      >
                        <FaTimes />
                      </button>
                    </div>

                    {/* Status do upload */}
                    {uploadStatus === 'uploading' && (
                      <div className="mt-3 flex items-center space-x-2 text-blue-700">
                        <FaSpinner className="animate-spin" />
                        <span className="text-sm font-medium">{uploadMessage}</span>
                      </div>
                    )}
                    {uploadStatus === 'success' && (
                      <div className="mt-3 flex items-center space-x-2 text-green-700">
                        <FaCheckCircle />
                        <span className="text-sm font-medium">{uploadMessage}</span>
                      </div>
                    )}
                    {uploadStatus === 'error' && (
                      <div className="mt-3 flex items-center space-x-2 text-red-700">
                        <FaExclamationTriangle />
                        <span className="text-sm font-medium">{uploadMessage}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Link manual como fallback */}
              <div>
                <label className="block text-sm font-bold text-gray-900 mb-2">
                  Ou cole um link do documento (Opcional)
                </label>
                <div className="relative">
                  <FaLink className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600" />
                  <input
                    type="url"
                    value={formData.linkDocumento}
                    onChange={(e) => setFormData({ ...formData, linkDocumento: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium placeholder-gray-500"
                    placeholder="https://drive.google.com/file/d/..."
                    disabled={!!selectedFile}
                  />
                </div>
                {selectedFile && (
                  <p className="text-gray-500 text-xs mt-1">
                    O link será gerado automaticamente a partir do arquivo selecionado.
                  </p>
                )}
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
                  disabled={isSubmitting || isUploading}
                  className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <FaSpinner className="animate-spin" />
                      <span>{isUploading ? 'Enviando arquivo...' : 'Registrando...'}</span>
                    </>
                  ) : (
                    <span>Registrar Ausência</span>
                  )}
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
