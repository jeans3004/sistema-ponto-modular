import { NextRequest, NextResponse } from 'next/server'
import { verificarAutenticacao } from '@/lib/authMiddleware'
import { adminDb } from '@/lib/firebaseAdmin'

// GET - Obter pontos de todos os funcionários para coordenadores
export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const authResult = await verificarAutenticacao(req)
    if (!authResult.success) {
      return NextResponse.json({
        error: authResult.error,
        code: 'AUTH_ERROR'
      }, { status: authResult.status })
    }

    // Verificar se o usuário é coordenador ou administrador
    const usuario = authResult.usuario!
    if (!usuario.niveisHierarquicos.includes('coordenador') && !usuario.niveisHierarquicos.includes('administrador')) {
      return NextResponse.json({
        error: 'Acesso negado: Apenas coordenadores podem acessar esta funcionalidade',
        code: 'ACCESS_DENIED'
      }, { status: 403 })
    }

    const url = new URL(req.url)
    const data = url.searchParams.get('data')
    
    // Se não especificar data, usar hoje
    const targetDate = data || new Date().toISOString().split('T')[0]

    // Buscar pontos de todos os funcionários para a data especificada
    const pontosSnapshot = await adminDb
      .collection('pontos')
      .where('data', '==', targetDate)
      .get()

    const pontos = pontosSnapshot.docs.map(doc => {
      const data = doc.data()
      return {
        id: doc.id,
        funcionarioEmail: data.funcionarioEmail,
        funcionarioNome: data.funcionarioNome,
        data: data.data,
        horaEntrada: data.horaEntrada,
        horaSaida: data.horaSaida,
        inicioAlmoco: data.inicioAlmoco,
        fimAlmoco: data.fimAlmoco,
        tempoAlmoco: data.tempoAlmoco,
        totalHoras: data.totalHoras
      }
    })

    // Buscar dados dos usuários para enriquecer as informações
    const usuariosSnapshot = await adminDb
      .collection('usuarios')
      .where('niveisHierarquicos', 'array-contains', 'colaborador')
      .get()

    const usuariosMap = new Map()
    usuariosSnapshot.docs.forEach(doc => {
      const userData = doc.data()
      usuariosMap.set(userData.email, {
        nome: userData.nome,
        foto: userData.foto
      })
    })

    // Enriquecer pontos com dados dos usuários
    const pontosEnriquecidos = pontos.map(ponto => {
      const userData = usuariosMap.get(ponto.funcionarioEmail)
      return {
        ...ponto,
        funcionarioNome: userData?.nome || ponto.funcionarioNome || 'Nome não encontrado'
      }
    })

    return NextResponse.json({
      success: true,
      pontos: pontosEnriquecidos,
      data: targetDate,
      total: pontosEnriquecidos.length
    })
  } catch (error) {
    console.error('Erro ao obter pontos para coordenador:', error)
    
    return NextResponse.json({
      error: 'Erro interno do servidor',
      code: 'INTERNAL_ERROR'
    }, { status: 500 })
  }
}