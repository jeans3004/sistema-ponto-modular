'use client'

import { useState } from 'react'
import { formatTime } from '@/lib/utils'
import { FaClock, FaPlay, FaStop, FaSpinner } from 'react-icons/fa'

interface StatusCardProps {
  isWorking: boolean
  lastEntry?: Date
  onClockIn: () => Promise<void>
  onClockOut: () => Promise<void>
}

export default function StatusCard({ 
  isWorking, 
  lastEntry, 
  onClockIn, 
  onClockOut 
}: StatusCardProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleClockAction = async () => {
    setIsLoading(true)
    try {
      if (isWorking) {
        await onClockOut()
      } else {
        await onClockIn()
      }
    } catch (error) {
      console.error('Erro ao registrar ponto:', error)
      alert('Erro ao registrar ponto. Tente novamente.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          Status Atual
        </h2>
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${isWorking ? 'bg-green-500' : 'bg-gray-400'}`}></div>
          <span className={`text-sm font-medium ${isWorking ? 'text-green-600' : 'text-gray-500'}`}>
            {isWorking ? 'Trabalhando' : 'Fora do trabalho'}
          </span>
        </div>
      </div>

      <div className="text-center space-y-4">
        {/* Relógio atual */}
        <div className="text-4xl font-bold text-gray-900">
          {formatTime(new Date())}
        </div>
        
        {/* Informação do último registro */}
        {lastEntry && (
          <p className="text-sm text-gray-600">
            Último registro: {formatTime(lastEntry)}
          </p>
        )}

        {/* Botão de ação */}
        <button
          onClick={handleClockAction}
          disabled={isLoading}
          className={`w-full py-3 px-6 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
            isWorking
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-green-600 hover:bg-green-700 text-white'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isLoading ? (
            <FaSpinner className="animate-spin" />
          ) : isWorking ? (
            <FaStop />
          ) : (
            <FaPlay />
          )}
          <span>
            {isLoading 
              ? 'Registrando...' 
              : isWorking 
                ? 'Registrar Saída' 
                : 'Registrar Entrada'
            }
          </span>
        </button>
      </div>
    </div>
  )
}
