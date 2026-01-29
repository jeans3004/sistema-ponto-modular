'use client'

import Link from 'next/link'

interface GeofenceAlertProps {
  onDismiss?: () => void
}

export function GeofenceAlert({ onDismiss }: GeofenceAlertProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 animate-slideDown">
      <div className="bg-emerald-500 text-white px-4 py-3 shadow-lg">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-xl flex-shrink-0" role="img" aria-label="pin">
              📍
            </span>
            <p className="text-sm font-medium truncate">
              Você está na área de trabalho!
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link
              href="/colaborador/dashboard"
              className="bg-white text-emerald-700 px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-emerald-50 transition-colors"
            >
              Bater Ponto
            </Link>
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-white/80 hover:text-white p-1"
                aria-label="Fechar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
