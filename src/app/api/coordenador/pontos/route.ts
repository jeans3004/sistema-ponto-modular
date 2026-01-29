import { NextRequest, NextResponse } from 'next/server'
import { verificarAutenticacao } from '@/lib/authMiddleware'
import { adminDb } from '@/lib/firebaseAdmin'
import { getCoordenacoesDoCoordenador } from '@/lib/firebaseDb'

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

    // Buscar coordenação do coordenador atual se não for admin
    const isAdmin = usuario.niveisHierarquicos?.includes('administrador')
    const nivelAtivo = usuario.nivelAtivo
    let coordenacaoFiltro = null
    
    if (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador')) {
      // Usar a mesma função que a interface "Minhas Coordenações" usa
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(usuario.email)
      
      console.log("📋 Coordenações ativas para pontos:", {
        email: usuario.email,
        coordenacoes: coordenacoesAtivas,
        quantidade: coordenacoesAtivas.length,
        nivelAtivo: nivelAtivo
      })

      // Se não tem coordenações ativas, retornar lista vazia
      if (coordenacoesAtivas.length === 0) {
        console.log("❌ Coordenador sem coordenações ativas na API de pontos")
        return NextResponse.json({
          success: true,
          pontos: [],
          data: targetDate,
          total: 0,
          message: "Coordenador não possui coordenações ativas atribuídas"
        })
      }

      // Usar a primeira coordenação para o filtro (pode ser expandido para múltiplas)
      coordenacaoFiltro = coordenacoesAtivas[0].id
      console.log(`🔍 Coordenador filtrando pontos pela coordenação ativa: ${coordenacaoFiltro}`)
    }

    // Buscar dados dos usuários para filtrar por coordenação
    let usuariosQuery = adminDb
      .collection('usuarios')
      .where('niveisHierarquicos', 'array-contains', 'colaborador')

    // Se for coordenador (não admin), filtrar apenas usuários da sua coordenação
    if (coordenacaoFiltro) {
      usuariosQuery = usuariosQuery.where('coordenacaoId', '==', coordenacaoFiltro)
    } else if (!isAdmin) {
      // Se coordenador mas sem coordenação (não deveria chegar aqui, mas por segurança)
      return NextResponse.json({
        success: true,
        pontos: [],
        data: targetDate,
        total: 0,
        message: "Nenhuma coordenação encontrada"
      })
    }

    const usuariosSnapshot = await usuariosQuery.get()
    
    const usuariosMap = new Map()
    const emailsPermitidos = new Set<string>()
    
    usuariosSnapshot.docs.forEach(doc => {
      const userData = doc.data()
      usuariosMap.set(userData.email, {
        nome: userData.nome,
        foto: userData.foto
      })
      emailsPermitidos.add(userData.email)
    })

    // Buscar pontos apenas dos funcionários da coordenação
    const pontosSnapshot = await adminDb
      .collection('pontos')
      .where('data', '==', targetDate)
      .get()

    // Filtrar pontos apenas dos usuários permitidos
    const pontos = pontosSnapshot.docs
      .map(doc => {
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
      .filter(ponto => emailsPermitidos.has(ponto.funcionarioEmail))

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