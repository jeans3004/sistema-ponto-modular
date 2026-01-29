'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { FaUser, FaEnvelope, FaShieldAlt, FaSpinner } from 'react-icons/fa'

export default function MinhaContaPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  if (status === 'loading' || isLoadingUser) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <FaSpinner className="animate-spin text-4xl text-blue-600" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Minha Conta</h1>
          {usuario && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <img src={usuario.foto || ''} alt="Foto do Perfil" className="w-24 h-24 rounded-full" />
                <div>
                  <h2 className="text-2xl font-semibold text-gray-800">{usuario.nome}</h2>
                  <p className="text-gray-600">{usuario.email}</p>
                </div>
              </div>
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações do Usuário</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <FaUser className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Nome Completo</p>
                      <p className="font-semibold text-gray-800">{usuario.nome}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <FaEnvelope className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-semibold text-gray-800">{usuario.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center bg-gray-50 p-4 rounded-lg">
                    <FaShieldAlt className="text-gray-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Nível de Acesso Ativo</p>
                      <p className="font-semibold text-gray-800 capitalize">{usuario.nivelAtivo}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
