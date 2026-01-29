import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

// Middleware que protege rotas específicas
export default withAuth(
  function middleware(req) {
    const { token } = req.nextauth
    const { pathname } = req.nextUrl

    // Permite acesso à página de login
    if (pathname === '/login') {
      return NextResponse.next()
    }

    // Redireciona para o dashboard se o usuário estiver autenticado e tentar acessar o login
    if (token && pathname === '/login') {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }

    // Lógica de autorização para a página de administração do banco de dados
    if (pathname.startsWith('/admin/database')) {
      if (!token || (token.email !== 'jean.machado1997@gmail.com' && !token.isDatabaseAdmin)) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl
        // Permite acesso não autenticado à página de login
        if (pathname === '/login') {
          return true
        }
        // Requer autenticação para todas as outras páginas no matcher
        return !!token
      },
    },
  }
)

// Configurar quais rotas devem ser protegidas
export const config = {
  matcher: [
    '/login',
    '/dashboard/:path*',
    '/aguardando',
    '/historico/:path*',
    '/ausencia/:path*',
    '/api/pontos/:path*',
    '/api/ausencia/:path*',
    '/api/admin/:path*',
    '/api/coordenador/:path*',
    '/admin/database',
    '/administrador/:path*',
    '/coordenador/:path*',
    '/colaborador/:path*'
  ],
}
