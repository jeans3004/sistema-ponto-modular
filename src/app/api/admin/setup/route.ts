import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { criarOuAtualizarUsuario, obterUsuario } from '@/lib/firebaseUsers'
import { NivelHierarquico } from '@/types/usuario'
import { adminDb } from '@/lib/firebaseAdmin'

// POST - Setup inicial do sistema (criar primeiro admin)
export async function POST(req: NextRequest) {
  try {
    // Verificar se o usuário está autenticado
    const session = await getServerSession()
    
    if (!session?.user?.email || !session?.user?.name) {
      return NextResponse.json({
        error: 'Usuário não autenticado',
        code: 'UNAUTHENTICATED'
      }, { status: 401 })
    }

    // Verificar se já existe algum administrador no sistema
    const adminSnapshot = await adminDb
      .collection('usuarios')
      .where('niveisHierarquicos', 'array-contains', 'administrador')
      .limit(1)
      .get()

    // Se já existe admin, apenas sincronizar o usuário atual
    if (!adminSnapshot.empty) {
      const usuario = await criarOuAtualizarUsuario(
        session.user.email,
        session.user.name,
        session.user.image || undefined
      )

      return NextResponse.json({
        success: true,
        message: 'Sistema já configurado. Usuário sincronizado.',
        usuario: {
          id: usuario.id,
          email: usuario.email,
          nome: usuario.nome,
          niveisHierarquicos: usuario.niveisHierarquicos,
          nivelAtivo: usuario.nivelAtivo,
          status: usuario.status,
        },
        isFirstAdmin: false
      })
    }

    // Se não existe admin, criar o primeiro admin (usuário atual)
    const usuario = await criarOuAtualizarUsuario(
      session.user.email,
      session.user.name,
      session.user.image || undefined
    )

    // Atualizar para ser administrador ativo
    await adminDb.collection('usuarios').doc(session.user.email).update({
      niveisHierarquicos: ['administrador', 'coordenador', 'colaborador'],
      nivelAtivo: 'administrador',
      status: 'ativo',
      aprovadoPor: 'SISTEMA_SETUP',
      dataAprovacao: new Date(),
    })

    // Buscar usuário atualizado
    const usuarioAtualizado = await obterUsuario(session.user.email)

    return NextResponse.json({
      success: true,
      message: 'Setup inicial concluído! Você é o primeiro administrador do sistema.',
      usuario: usuarioAtualizado,
      isFirstAdmin: true
    })
  } catch (error) {
    console.error('Erro no setup inicial:', error)
    
    return NextResponse.json({
      error: 'Erro ao configurar sistema',
      code: 'SETUP_ERROR'
    }, { status: 500 })
  }
}