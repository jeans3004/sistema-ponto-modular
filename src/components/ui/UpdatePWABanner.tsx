'use client'

import { FiRefreshCw } from 'react-icons/fi'
import { useServiceWorker } from '@/components/providers/ServiceWorkerProvider'

export function UpdatePWABanner() {
  const { updateAvailable, applyUpdate } = useServiceWorker()

  if (!updateAvailable) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] animate-slideDown">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <FiRefreshCw className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium truncate">
              Nova versão disponível!
            </p>
          </div>
          <button
            onClick={applyUpdate}
            className="flex-shrink-0 bg-white text-blue-700 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-50 transition-colors"
          >
            Atualizar agora
          </button>
        </div>
      </div>
    </div>
  )
}
