'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getGreeting } from '@/lib/utils'
import NivelSelector from '@/components/ui/NivelSelector'
import { useUsuario } from '@/hooks/useUsuario'
import { 
  FaSignOutAlt, 
  FaUser, 
  FaHome, 
  FaHistory, 
  FaClock,
  FaChevronDown,
  FaBars,
  FaTimes,
  FaShieldAlt,
  FaChartLine,
  FaUserTag
} from 'react-icons/fa'

export default function Header() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const { usuario } = useUsuario()
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)

  // Atualizar relógio - só no cliente para evitar hidratação
  useEffect(() => {
    // Definir hora inicial no cliente
    setCurrentTime(new Date())
    
    // Atualizar a cada segundo
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

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

  // Determinar URL do dashboard baseado no nível ativo do usuário
  const getDashboardUrl = () => {
    if (!usuario) return '/dashboard'
    switch (usuario.nivelAtivo) {
      case 'administrador':
        return '/administrador/dashboard'
      case 'coordenador':
        return '/coordenador/dashboard'
      case 'colaborador':
        return '/colaborador/dashboard'
      default:
        return '/dashboard'
    }
  }

  const navigation = [
    { name: 'Dashboard', href: getDashboardUrl(), icon: FaHome, description: 'Painel principal' },
    { name: 'Histórico', href: '/historico', icon: FaHistory, description: 'Registros anteriores' },
  ]

  return (
    <>
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
                </div>
              </div>

              {/* Navegação Desktop */}
              <nav className="hidden lg:flex ml-12 space-x-2">
                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`group relative flex items-center px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="mr-3 text-lg" />
                      <span>{item.name}</span>
                      
                      {/* Tooltip */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
                        {item.description}
                      </div>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Seção Direita - Relógio, Cargo e Usuário */}
            <div className="flex items-center space-x-4">
              {/* Relógio */}
              <div className="hidden md:block text-right bg-gray-50 rounded-xl px-4 py-2">
                <div className="text-lg font-bold text-gray-900">
                  {currentTime ? formatTime(currentTime) : '--:--:--'}
                </div>
                <div className="text-gray-600 text-sm">
                  {currentTime ? formatDate(currentTime) : '--'}
                </div>
              </div>

              {/* Seletor de Nível Hierárquico */}
              <div className="hidden sm:block">
                <NivelSelector />
              </div>

              {/* Menu do Usuário */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center space-x-3 bg-gray-50 hover:bg-gray-100 rounded-xl px-4 py-3 border border-gray-200 transition-all duration-200 group"
                >
                  {session?.user?.image ? (
                    <img
                      src={session.user.image}
                      alt="Avatar"
                      className="h-8 w-8 rounded-full border-2 border-gray-300"
                    />
                  ) : (
                    <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <FaUser className="text-white text-sm" />
                    </div>
                  )}
                  <span className="hidden sm:block text-gray-900 font-medium">
                    {session?.user?.name?.split(' ')[0]}
                  </span>
                  <FaChevronDown className={`text-gray-500 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50">
                    <div className="px-4 py-3 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {session?.user?.name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {session?.user?.email}
                      </p>
                    </div>
                    
                    <div className="py-2">
                      <div className="px-4 py-2 text-xs text-gray-500 uppercase tracking-wide font-semibold">
                        Perfil
                      </div>
                      <Link 
                        href="/minha-conta"
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <FaUser className="mr-3 text-blue-600" />
                        Minha Conta
                      </Link>
                      <Link 
                        href="/configuracoes"
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 transition-colors"
                      >
                        <FaShieldAlt className="mr-3 text-green-600" />
                        Configurações
                      </Link>
                    </div>
                    
                    <div className="border-t border-gray-200 py-2">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center px-4 py-2 text-sm text-red-700 hover:bg-red-50 transition-colors"
                      >
                        <FaSignOutAlt className="mr-3 text-red-600" />
                        Sair do Sistema
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Menu Mobile */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                {isMenuOpen ? <FaTimes className="text-xl" /> : <FaBars className="text-xl" />}
              </button>
            </div>
          </div>

          {/* Menu Mobile Expandido */}
          {isMenuOpen && (
            <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg">
              <div className="px-4 py-6 space-y-4">
                {/* Seletor de Nível Hierárquico no mobile */}
                <div>
                  <NivelSelector />
                </div>

                {navigation.map((item) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex items-center p-4 rounded-xl transition-all duration-200 ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-blue-50'
                      }`}
                    >
                      <Icon className="mr-4 text-xl" />
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm opacity-75">{item.description}</p>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Clique fora para fechar menus */}
        {(isUserMenuOpen || isMenuOpen) && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsUserMenuOpen(false)
              setIsMenuOpen(false)
            }}
          />
        )}
      </header>
    </>
  )
}
