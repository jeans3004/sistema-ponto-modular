import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'

// Configuração do NextAuth.js para autenticação
const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }
