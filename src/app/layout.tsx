import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import AuthProvider from '@/components/providers/AuthProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sistema de Controle de Pontos',
  description: 'Sistema para gerenciamento de pontos de funcionários',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Envolver toda a aplicação com o provider de autenticação */}
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
