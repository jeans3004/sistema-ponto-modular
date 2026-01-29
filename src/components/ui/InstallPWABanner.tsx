'use client'

import { useState } from 'react'
import { FiDownload, FiX, FiShare, FiPlusSquare } from 'react-icons/fi'
import { usePWA } from '@/hooks/usePWA'

export function InstallPWABanner() {
  const {
    showBanner,
    isIOS,
    isInstallable,
    install,
    dismissBanner
  } = usePWA()

  const [isInstalling, setIsInstalling] = useState(false)

  if (!showBanner) return null

  const handleInstall = async () => {
    setIsInstalling(true)
    await install()
    setIsInstalling(false)
  }

  // Banner para iOS (instruções manuais)
  if (isIOS) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
        <div className="bg-white border-t border-gray-200 shadow-lg p-4 mx-auto max-w-lg rounded-t-2xl">
          <button
            onClick={dismissBanner}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f4636e] to-[#e5545f] flex items-center justify-center flex-shrink-0">
              <img
                src="/icons/icon-72x72.png"
                alt="Ponto Digital"
                className="w-10 h-10"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg">
                Instalar Ponto Digital
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Adicione à tela inicial para acesso rápido
              </p>
            </div>
          </div>

          <div className="mt-4 bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-700 mb-2">
              <span className="font-medium">Como instalar:</span>
            </p>
            <ol className="text-sm text-gray-600 space-y-2">
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#f4636e] text-white flex items-center justify-center text-xs font-bold">1</span>
                <span>Toque em</span>
                <FiShare className="w-4 h-4 text-blue-500" />
                <span>(Compartilhar)</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#f4636e] text-white flex items-center justify-center text-xs font-bold">2</span>
                <span>Selecione</span>
                <FiPlusSquare className="w-4 h-4 text-gray-700" />
                <span>&quot;Adicionar à Tela Inicial&quot;</span>
              </li>
            </ol>
          </div>

          <button
            onClick={dismissBanner}
            className="w-full mt-3 py-2 text-sm text-gray-500 hover:text-gray-700"
          >
            Agora não
          </button>
        </div>
      </div>
    )
  }

  // Banner para Android/Desktop (instalação nativa)
  if (isInstallable) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 animate-slideUp">
        <div className="bg-white border-t border-gray-200 shadow-lg p-4 mx-auto max-w-lg rounded-t-2xl">
          <button
            onClick={dismissBanner}
            className="absolute top-3 right-3 p-1 text-gray-400 hover:text-gray-600"
            aria-label="Fechar"
          >
            <FiX className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#f4636e] to-[#e5545f] flex items-center justify-center flex-shrink-0 shadow-md">
              <img
                src="/icons/icon-72x72.png"
                alt="Ponto Digital"
                className="w-10 h-10"
              />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 text-lg">
                Instalar Ponto Digital
              </h3>
              <p className="text-sm text-gray-600">
                Acesso rápido direto da sua tela inicial
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-4">
            <button
              onClick={dismissBanner}
              className="flex-1 py-2.5 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
            >
              Agora não
            </button>
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="flex-1 py-2.5 px-4 bg-[#f4636e] text-white rounded-lg font-medium hover:bg-[#e5545f] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isInstalling ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FiDownload className="w-5 h-5" />
                  Instalar
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return null
}
