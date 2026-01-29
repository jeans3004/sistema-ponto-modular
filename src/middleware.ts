import { withAuth } from 'next-auth/middleware'

// Middleware que protege rotas específicas
export default withAuth(
  function middleware(req) {
    // Aqui você pode adicionar lógica adicional se necessário
    console.log('Middleware executado para:', req.nextUrl.pathname)
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        // Retorna true se o usuário está autorizado
        return !!token
      },
    },
  }
)

// Configurar quais rotas devem ser protegidas
export const config = {
  matcher: ['/dashboard/:path*', '/historico/:path*', '/ausencia/:path*', '/api/pontos/:path*', '/api/ausencia/:path*']
}
