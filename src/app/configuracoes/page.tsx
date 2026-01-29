'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Header from '@/components/dashboard/Header'
import { useUsuario } from '@/hooks/useUsuario'
import { FaSave, FaSpinner } from 'react-icons/fa'

export default function ConfiguracoesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { usuario, isLoading: isLoadingUser } = useUsuario()
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  const handleSaveChanges = async () => {
    setIsSaving(true)
    // Lógica para salvar as configurações aqui
    setTimeout(() => {
      setIsSaving(false)
      alert('Configurações salvas com sucesso!')
    }, 2000)
  }

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Configurações</h1>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Notificações</h3>
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-800">Receber notificações por email</p>
                <input type="checkbox" className="toggle-checkbox" />
              </div>
            </div>
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={handleSaveChanges}
                disabled={isSaving}
                className="w-full flex justify-center items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <FaSpinner className="animate-spin mr-3" />
                ) : (
                  <FaSave className="mr-3" />
                )}
                {isSaving ? 'Salvando...' : 'Salvar Alterações'}
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
