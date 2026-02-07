'use client'

import { SessionProvider } from 'next-auth/react'
import { ReactNode } from 'react'

// Componente que fornece o contexto de autenticação para toda a aplicação
interface AuthProviderProps {
  children: ReactNode
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <SessionProvider refetchOnWindowFocus={false}>
      {children}
    </SessionProvider>
  )
}
