'use client'

import { useState } from 'react'
import { FaTimes, FaTools, FaCode, FaRocket, FaSpinner } from 'react-icons/fa'

interface DevelopmentModalProps {
  isOpen: boolean
  onClose: () => void
  featureName: string
  description?: string
}

export default function DevelopmentModal({ 
  isOpen, 
  onClose, 
  featureName, 
  description 
}: DevelopmentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 relative">
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <FaTimes className="text-gray-500" />
        </button>

        {/* Conteúdo */}
        <div className="text-center">
          {/* Ícone */}
          <div className="relative mb-6">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-lg">
              <FaTools className="text-white text-3xl" />
            </div>
            <div className="absolute -top-1 -right-1 bg-blue-500 rounded-full p-2 shadow-md">
              <FaSpinner className="text-white animate-spin" />
            </div>
          </div>

          {/* Título */}
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Funcionalidade em Desenvolvimento
          </h3>

          {/* Descrição */}
          <div className="bg-yellow-50 rounded-xl p-4 mb-6">
            <p className="text-gray-700 mb-2">
              <strong>{featureName}</strong>
            </p>
            <p className="text-gray-600 text-sm">
              {description || 'Esta funcionalidade está sendo desenvolvida e estará disponível em breve.'}
            </p>
          </div>

          {/* Status */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-center mb-3">
              <FaCode className="text-blue-600 mr-2" />
              <span className="text-blue-800 font-medium">Status: Em Desenvolvimento</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div className="bg-blue-500 h-2 rounded-full w-2/3 animate-pulse"></div>
            </div>
          </div>

          {/* Mensagem de Agradecimento */}
          <div className="text-center">
            <FaRocket className="text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600 text-sm">
              Obrigado pela paciência! Estamos trabalhando para trazer 
              as melhores funcionalidades para você.
            </p>
          </div>

          {/* Botão OK */}
          <button
            onClick={onClose}
            className="mt-6 w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}
