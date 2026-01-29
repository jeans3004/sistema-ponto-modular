import type { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { adminDb } from './firebaseAdmin' // Usar o Admin SDK

// Função para verificar se um usuário é administrador do banco de dados
export const isDatabaseAdmin = async (uid: string) => {
  if (!uid) return false
  try {
    const adminQuery = await adminDb
      .collection('databaseAdmins')
      .where('uid', '==', uid)
      .limit(1)
      .get()

    return !adminQuery.empty
  } catch (error) {
    console.error('Erro ao verificar admin do banco de dados:', error)
    return false
  }
}

// Configuração do NextAuth.js para autenticação
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false // Set to true in production with HTTPS
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // TODO: Adicionar lógica para verificar se o usuário existe no Firestore
      // e se o status dele é 'ativo'. Por enquanto, permitimos todos.
      return true
    },
    async jwt({ token, user }) {
      // No primeiro login, o objeto 'user' está disponível
      if (user) {
        token.uid = user.id
        token.isDatabaseAdmin = await isDatabaseAdmin(user.id)
      }
      return token
    },
    async session({ session, token }) {
      // Adiciona as propriedades customizadas à sessão
      if (session.user) {
        session.user.uid = token.uid as string
        session.user.isDatabaseAdmin = token.isDatabaseAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Página customizada de login que criaremos
  },
}