'use client'

import { FiWifiOff, FiRefreshCw } from 'react-icons/fi'

export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiWifiOff className="w-10 h-10 text-gray-400" />
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Sem Conexão
        </h1>

        <p className="text-gray-600 mb-6">
          Você está offline. Verifique sua conexão com a internet e tente novamente.
        </p>

        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-2 bg-[#f4636e] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#e5545f] transition-colors"
        >
          <FiRefreshCw className="w-5 h-5" />
          Tentar Novamente
        </button>

        <p className="text-sm text-gray-500 mt-6">
          Algumas funcionalidades podem estar disponíveis offline após o primeiro acesso.
        </p>
      </div>
    </div>
  )
}
