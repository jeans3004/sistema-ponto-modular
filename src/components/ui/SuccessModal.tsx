'use client'

import { useEffect } from 'react'
import { 
  FaCheck, 
  FaPlay, 
  FaStop, 
  FaUtensils, 
  FaTimes,
  FaMapMarkerAlt,
  FaClock,
  FaGraduationCap,
  FaPause
} from 'react-icons/fa'

interface SuccessModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'entrada' | 'saida' | 'inicio-almoco' | 'fim-almoco' | 'inicio-htp' | 'fim-htp'
  time: string
  distance?: number
  message?: string
}

export default function SuccessModal({ 
  isOpen, 
  onClose, 
  type, 
  time, 
  distance, 
  message 
}: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Auto-close após 3 segundos
      const timer = setTimeout(() => {
        onClose()
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const getTypeConfig = () => {
    switch (type) {
      case 'entrada':
        return {
          icon: FaPlay,
          title: 'Entrada Registrada!',
          subtitle: 'Bom trabalho! Seu horário de entrada foi registrado com sucesso.',
          color: 'green',
          bgGradient: 'from-green-500 to-emerald-600'
        }
      case 'saida':
        return {
          icon: FaStop,
          title: 'Saída Registrada!',
          subtitle: 'Ótimo trabalho hoje! Seu horário de saída foi registrado.',
          color: 'red',
          bgGradient: 'from-red-500 to-rose-600'
        }
      case 'inicio-almoco':
        return {
          icon: FaUtensils,
          title: 'Início do Almoço!',
          subtitle: 'Aproveite sua pausa! O horário foi registrado.',
          color: 'orange',
          bgGradient: 'from-orange-500 to-amber-600'
        }
      case 'fim-almoco':
        return {
          icon: FaPlay,
          title: 'Retorno do Almoço!',
          subtitle: 'Bem-vindo de volta! Continuemos o trabalho.',
          color: 'blue',
          bgGradient: 'from-blue-500 to-indigo-600'
        }
      case 'inicio-htp':
        return {
          icon: FaGraduationCap,
          title: 'Início do HTP!',
          subtitle: 'Hora do Trabalho Pedagógico iniciada com sucesso.',
          color: 'purple',
          bgGradient: 'from-purple-500 to-violet-600'
        }
      case 'fim-htp':
        return {
          icon: FaPause,
          title: 'Fim do HTP!',
          subtitle: 'Hora do Trabalho Pedagógico finalizada.',
          color: 'indigo',
          bgGradient: 'from-indigo-500 to-blue-600'
        }
      default:
        return {
          icon: FaCheck,
          title: 'Sucesso!',
          subtitle: 'Operação realizada com sucesso.',
          color: 'green',
          bgGradient: 'from-green-500 to-emerald-600'
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
            {config.title}
          </h2>

          {/* Subtítulo */}
          <p className="text-gray-600 mb-6">
            {message || config.subtitle}
          </p>

          {/* Informações do registro */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center space-x-4 text-sm">
              {/* Horário */}
              <div className="flex items-center space-x-2">
                <FaClock className={`text-${config.color}-600`} />
                <span className="font-semibold text-gray-800">{time}</span>
              </div>

              {/* Distância (se disponível) */}
              {distance !== undefined && (
                <>
                  <div className="w-1 h-1 bg-gray-400 rounded-full"></div>
                  <div className="flex items-center space-x-2">
                    <FaMapMarkerAlt className="text-green-600" />
                    <span className="text-gray-600">{Math.round(distance)}m</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Botão de ação */}
          <button
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${config.bgGradient} hover:opacity-90 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg`}
          >
            Continuar
          </button>

          {/* Indicador de auto-close */}
          <p className="text-xs text-gray-400 mt-3">
            Esta mensagem será fechada automaticamente em alguns segundos
          </p>
        </div>
      </div>
    </div>
  )
}