'use client'

import { useState } from 'react'
import { useUsuario } from '@/hooks/useUsuario'
import { NivelHierarquico, LABELS_NIVEIS, CORES_NIVEIS } from '@/types/usuario'
import { 
  FaChevronDown, 
  FaUserShield, 
  FaUsers, 
  FaUser,
  FaSpinner,
  FaCheckCircle
} from 'react-icons/fa'

interface NivelSelectorProps {
  className?: string
  compact?: boolean
}

export default function NivelSelector({ className = '', compact = false }: NivelSelectorProps) {
  const { usuario, isLoading, trocarNivel } = useUsuario()
  const [isOpen, setIsOpen] = useState(false)
  const [isTrocando, setIsTrocando] = useState(false)

  // Se não tem usuário ou está carregando
  if (isLoading || !usuario) {
    return (
      <div className={`flex items-center bg-gray-100 rounded-xl px-3 py-2 ${className}`}>
        <FaSpinner className="animate-spin text-gray-400 mr-2" />
        <span className="text-sm text-gray-500">Carregando...</span>
      </div>
    )
  }

  // Se usuário está pendente ou inativo
  if (usuario.status !== 'ativo') {
    const statusInfo = {
      pendente: { color: 'bg-yellow-100 text-yellow-800', label: 'Pendente Aprovação' },
      inativo: { color: 'bg-red-100 text-red-800', label: 'Conta Inativa' }
    }

    const info = statusInfo[usuario.status as keyof typeof statusInfo]

    return (
      <div className={`flex items-center ${info.color} border rounded-xl px-3 py-2 ${className}`}>
        <FaUser className="mr-2" />
        <span className="text-sm font-medium">{info.label}</span>
      </div>
    )
  }

  // Ícones para cada nível
  const getIconForNivel = (nivel: NivelHierarquico) => {
    switch (nivel) {
      case 'administrador':
        return <FaUserShield className="text-red-600" />
      case 'coordenador':
        return <FaUsers className="text-blue-600" />
      case 'colaborador':
        return <FaUser className="text-green-600" />
    }
  }

  // Função para trocar nível
  const handleTrocarNivel = async (novoNivel: NivelHierarquico) => {
    if (novoNivel === usuario.nivelAtivo) {
      setIsOpen(false)
      return
    }

    setIsTrocando(true)
    
    try {
      const sucesso = await trocarNivel(novoNivel)
      if (sucesso) {
        setIsOpen(false)
      }
    } catch (error) {
      console.error('Erro ao trocar nível:', error)
    } finally {
      setIsTrocando(false)
    }
  }

  // Se tem apenas um nível, não mostrar dropdown
  if (usuario.niveisHierarquicos.length === 1) {
    return (
      <div className={`flex items-center ${CORES_NIVEIS[usuario.nivelAtivo]} border rounded-xl px-3 py-2 ${className}`}>
        {getIconForNivel(usuario.nivelAtivo)}
        <div className="ml-2">
          {!compact && <p className="text-xs font-medium">Nível de Acesso</p>}
          <p className="text-sm font-bold">{LABELS_NIVEIS[usuario.nivelAtivo]}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => !isTrocando && setIsOpen(!isOpen)}
        disabled={isTrocando}
        className={`flex items-center ${CORES_NIVEIS[usuario.nivelAtivo]} border rounded-xl px-3 py-2 transition-all duration-200 hover:shadow-md ${
          isTrocando ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
        }`}
      >
        {isTrocando ? (
          <FaSpinner className="animate-spin text-gray-600" />
        ) : (
          getIconForNivel(usuario.nivelAtivo)
        )}
        <div className="ml-2 text-left">
          {!compact && <p className="text-xs font-medium">Nível de Acesso</p>}
          <p className="text-sm font-bold">{LABELS_NIVEIS[usuario.nivelAtivo]}</p>
        </div>
        {usuario.niveisHierarquicos.length > 1 && !isTrocando && (
          <FaChevronDown className={`ml-2 text-xs transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && !isTrocando && (
        <div className="absolute top-full right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
          <div className="px-3 py-2 border-b border-gray-200">
            <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold">
              Trocar Nível de Acesso
            </p>
          </div>
          
          <div className="py-1">
            {usuario.niveisHierarquicos.map((nivel) => (
              <button
                key={nivel}
                onClick={() => handleTrocarNivel(nivel)}
                className={`w-full flex items-center px-3 py-2 text-sm transition-colors ${
                  nivel === usuario.nivelAtivo
                    ? 'bg-blue-50 text-blue-900'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="mr-3">
                  {getIconForNivel(nivel)}
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium">{LABELS_NIVEIS[nivel]}</p>
                  <p className="text-xs text-gray-500">
                    {nivel === 'administrador' && 'Controle total do sistema'}
                    {nivel === 'coordenador' && 'Gestão de funcionários'}
                    {nivel === 'colaborador' && 'Registro de pontos'}
                  </p>
                </div>
                {nivel === usuario.nivelAtivo && (
                  <FaCheckCircle className="text-blue-600 ml-2" />
                )}
              </button>
            ))}
          </div>
          
          <div className="px-3 py-2 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Você tem acesso a {usuario.niveisHierarquicos.length} nível{usuario.niveisHierarquicos.length > 1 ? 'is' : ''} hierárquico{usuario.niveisHierarquicos.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>
      )}

      {/* Clique fora para fechar */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}