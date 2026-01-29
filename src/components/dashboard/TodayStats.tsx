'use client'

import { formatTime, calculateWorkHours } from '@/lib/utils'
// Adicionar FaPlay e FaStop nas importações
import { FaClock, FaCalendarDay, FaChartLine, FaPlay, FaStop } from 'react-icons/fa'

interface TodayStatsProps {
  entryTime?: Date
  exitTime?: Date
  totalHours: string
  expectedHours: string
}

export default function TodayStats({ 
  entryTime, 
  exitTime, 
  totalHours, 
  expectedHours 
}: TodayStatsProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">
        Resumo de Hoje
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Entrada */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaPlay className="text-green-600 text-sm" />
            <span className="text-sm font-medium text-gray-700">Entrada</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {entryTime ? formatTime(entryTime) : '--:--'}
          </div>
        </div>

        {/* Saída */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaStop className="text-red-600 text-sm" />
            <span className="text-sm font-medium text-gray-700">Saída</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {exitTime ? formatTime(exitTime) : '--:--'}
          </div>
        </div>

        {/* Horas Trabalhadas */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaClock className="text-blue-600 text-sm" />
            <span className="text-sm font-medium text-gray-700">Trabalhadas</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {totalHours}
          </div>
        </div>

        {/* Horas Previstas */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center space-x-2 mb-2">
            <FaChartLine className="text-purple-600 text-sm" />
            <span className="text-sm font-medium text-gray-700">Previstas</span>
          </div>
          <div className="text-2xl font-bold text-gray-900">
            {expectedHours}
          </div>
        </div>
      </div>
    </div>
  )
}
