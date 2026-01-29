import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { criarOuAtualizarUsuario } from '@/lib/firebaseUsers'

// POST - Sincronizar usuário no primeiro login
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado no NextAuth
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !session?.user?.name) {
      return NextResponse.json({
        error: 'Sessão inválida',
        code: 'INVALID_SESSION'
      }, { status: 401 })
    }

    // Criar ou atualizar usuário no Firebase
    const usuario = await criarOuAtualizarUsuario(
      session.user.email,
      session.user.name,
      session.user.image || undefined
    )

    return NextResponse.json({
      success: true,
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nome: usuario.nome,
        foto: usuario.foto,
        niveisHierarquicos: usuario.niveisHierarquicos,
        nivelAtivo: usuario.nivelAtivo,
        status: usuario.status,
        configuracoes: usuario.configuracoes,
      },
      isNewUser: usuario.dataCadastro && new Date().getTime() - new Date(usuario.dataCadastro).getTime() < 5000 // Criado nos últimos 5 segundos
    })
  } catch (error) {
    console.error('Erro na sincronização do usuário:', error)
    
    return NextResponse.json({
      error: 'Erro ao sincronizar usuário',
      code: 'SYNC_ERROR'
    }, { status: 500 })
  }
}