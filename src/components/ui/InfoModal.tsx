'use client'

import { useEffect } from 'react'
import { 
  FaInfoCircle, 
  FaTimes,
  FaClock,
  FaCalendarDay,
  FaExclamationTriangle
} from 'react-icons/fa'

interface InfoModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'warning' | 'info' | 'error'
  title: string
  message: string
  details?: string
  autoClose?: boolean
  autoCloseDelay?: number
}

export default function InfoModal({ 
  isOpen, 
  onClose, 
  type = 'info',
  title,
  message,
  details,
  autoClose = false,
  autoCloseDelay = 4000
}: InfoModalProps) {
  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose()
      }, autoCloseDelay)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose, autoClose, autoCloseDelay])

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'warning':
        return {
          icon: FaExclamationTriangle,
          bgGradient: 'from-yellow-500 to-orange-600',
          bgColor: 'bg-yellow-50',
          borderColor: 'border-yellow-200',
          textColor: 'text-yellow-900',
          iconColor: 'text-yellow-600'
        }
      case 'error':
        return {
          icon: FaExclamationTriangle,
          bgGradient: 'from-red-500 to-red-600',
          bgColor: 'bg-red-50',
          borderColor: 'border-red-200',
          textColor: 'text-red-900',
          iconColor: 'text-red-600'
        }
      default: // info
        return {
          icon: FaInfoCircle,
          bgGradient: 'from-blue-500 to-indigo-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200',
          textColor: 'text-blue-900',
          iconColor: 'text-blue-600'
        }
    }
  }

  const config = getTypeConfig()
  const IconComponent = config.icon

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl transform animate-fadeIn relative">
        {/* Botão de fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <FaTimes className="text-xl" />
        </button>

        <div className="text-center">
          {/* Ícone principal com animação */}
          <div className={`w-20 h-20 bg-gradient-to-r ${config.bgGradient} rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce`}>
            <IconComponent className="text-white text-3xl" />
          </div>

          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {title}
          </h2>

          {/* Mensagem principal */}
          <p className="text-gray-600 mb-4">
            {message}
          </p>

          {/* Detalhes adicionais */}
          {details && (
            <div className={`${config.bgColor} ${config.borderColor} rounded-xl p-4 mb-6 border`}>
              <div className="flex items-start space-x-3">
                <FaCalendarDay className={`${config.iconColor} mt-1 flex-shrink-0`} />
                <div className="text-left">
                  <p className={`text-sm ${config.textColor} font-medium`}>
                    Detalhes do Registro:
                  </p>
                  <p className={`text-sm ${config.textColor} opacity-90 mt-1`}>
                    {details}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Botão de ação */}
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${config.bgGradient} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            Entendi
          </button>

          {/* Indicador de auto-close */}
          {autoClose && (
            <p className="text-xs text-gray-400 mt-3">
              Esta mensagem será fechada automaticamente em alguns segundos
            </p>
          )}
        </div>
      </div>
    </div>
  )
}