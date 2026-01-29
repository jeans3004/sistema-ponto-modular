import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'

// Configuração do NextAuth.js para autenticação
const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Callback executado quando o usuário faz login
    async signIn({ user, account, profile }) {
      // Aqui você pode adicionar lógica para verificar se o usuário
      // está autorizado a usar o sistema
      return true
    },
    // Callback para customizar a sessão
    async session({ session, token }) {
      // Aqui você pode adicionar informações extras à sessão
      return session
    },
  },
  pages: {
    signIn: '/login', // Página customizada de login que criaremos
  },
})

export { handler as GET, handler as POST }
