import type { NextAuthOptions } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
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

// Função para renovar o access_token do Google usando o refresh_token
async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type: 'refresh_token',
        refresh_token: token.refreshToken as string,
      }),
    })

    const refreshedTokens = await response.json()

    if (!response.ok) {
      throw refreshedTokens
    }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      // O refresh_token só é retornado na primeira vez, manter o existente
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    }
  } catch (error) {
    console.error('Erro ao renovar access token:', error)
    return {
      ...token,
      error: 'RefreshAccessTokenError',
    }
  }
}

// Configuração do NextAuth.js para autenticação
export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'openid email profile https://www.googleapis.com/auth/drive',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production'
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      }
    }
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // TODO: Adicionar lógica para verificar se o usuário existe no Firestore
      // e se o status dele é 'ativo'. Por enquanto, permitimos todos.
      return true
    },
    async jwt({ token, user, account }) {
      // No primeiro login, o objeto 'user' e 'account' estão disponíveis
      if (user) {
        token.uid = user.id
        try {
          token.isDatabaseAdmin = await isDatabaseAdmin(user.id)
        } catch (error) {
          console.error('Erro ao verificar isDatabaseAdmin no jwt callback:', error)
          token.isDatabaseAdmin = false
        }
      }

      // Capturar tokens OAuth do Google no primeiro login
      if (account) {
        token.accessToken = account.access_token
        token.refreshToken = account.refresh_token
        token.accessTokenExpires = account.expires_at
          ? account.expires_at * 1000
          : undefined
      }

      // Se o token ainda não expirou, retornar como está
      if (
        token.accessTokenExpires &&
        Date.now() < token.accessTokenExpires
      ) {
        return token
      }

      // Se expirou e temos refresh_token, renovar
      if (token.refreshToken) {
        return refreshAccessToken(token)
      }

      return token
    },
    async session({ session, token }) {
      // Adiciona as propriedades customizadas à sessão
      if (session.user) {
        session.user.uid = token.uid as string
        session.user.isDatabaseAdmin = token.isDatabaseAdmin as boolean
      }
      session.accessToken = token.accessToken as string | undefined
      return session
    },
  },
  pages: {
    signIn: '/login', // Página customizada de login que criaremos
  },
}