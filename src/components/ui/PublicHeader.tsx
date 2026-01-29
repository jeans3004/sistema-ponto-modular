'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaClock, FaHome, FaSignInAlt } from 'react-icons/fa'

export default function PublicHeader() {
  const [currentTime, setCurrentTime] = useState(new Date())

  // Atualizar relógio
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    })
  }

  return (
    <header className="relative z-50 bg-white shadow-lg border-b border-gray-200">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo e Branding */}
          <div className="flex items-center">
            <div className="flex items-center space-x-4">
              <div className="h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <FaClock className="text-white text-xl" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold text-gray-900 leading-tight">
                  Sistema de Controle
                  <span className="block text-blue-600">de Pontos</span>
                </h1>
                <p className="text-sm text-gray-600">
                  Centro de Educação Integral Christ Master
                </p>
              </div>
            </div>
          </div>

          {/* Seção Direita - Relógio e Navegação */}
          <div className="flex items-center space-x-4">
            {/* Relógio */}
            <div className="hidden md:block text-right bg-gray-50 rounded-xl px-4 py-2">
              <div className="text-lg font-bold text-gray-900">
                {formatTime(currentTime)}
              </div>
              <div className="text-gray-600 text-sm">
                {formatDate(currentTime)}
              </div>
            </div>

            {/* Navegação */}
            <div className="flex items-center space-x-2">
              <Link
                href="/"
                className="flex items-center px-4 py-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
              >
                <FaHome className="mr-2" />
                <span className="hidden sm:block">Início</span>
              </Link>
              <Link
                href="/login"
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200"
              >
                <FaSignInAlt className="mr-2" />
                <span>Entrar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
