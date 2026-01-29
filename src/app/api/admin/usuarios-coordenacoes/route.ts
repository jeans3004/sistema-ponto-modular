import { NextResponse } from "next/server"
import { verificarAutenticacao } from "@/lib/authMiddleware"
import { adminDb } from "@/lib/firebaseAdmin"

export async function POST(req: Request) {
  try {
    // Verificar autenticação passando a requisição
    const authResult = await verificarAutenticacao(req as any)
    if (!authResult.success) {
      return NextResponse.json({ 
        success: false,
        error: authResult.error || "Autenticação falhou"
      }, { status: authResult.status || 401 })
    }

    // Verificar se é administrador
    const usuario = authResult.usuario!
    if (!usuario.niveisHierarquicos?.includes('administrador')) {
      return NextResponse.json({
        success: false,
        error: "Acesso negado - você precisa ser administrador"
      }, { status: 403 })
    }

    const body = await req.json()
    const { 
      acao, 
      emailUsuario, 
      coordenacaoId, 
      coordenacaoNome, 
      tipoColaborador 
    } = body

    console.log("📋 Ação solicitada:", acao, "para usuário:", emailUsuario)

    // Buscar usuário
    const usuarioSnapshot = await adminDb
      .collection('usuarios')
      .where('email', '==', emailUsuario)
      .limit(1)
      .get()

    if (usuarioSnapshot.empty) {
      return NextResponse.json({ 
        success: false, 
        error: "Usuário não encontrado" 
      }, { status: 404 })
    }

    const usuarioDoc = usuarioSnapshot.docs[0]
    const usuarioData = usuarioDoc.data()
    
    console.log("👤 Dados do usuário atual:", {
      email: usuarioData.email,
      nome: usuarioData.nome,
      coordenacaoId: usuarioData.coordenacaoId,
      tipoColaborador: usuarioData.tipoColaborador,
      niveisHierarquicos: usuarioData.niveisHierarquicos
    })

    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy: usuario.email
    }

    console.log("🔄 Processando ação:", acao)
    console.log("📋 Dados recebidos:", { acao, emailUsuario, coordenacaoId, coordenacaoNome, tipoColaborador })

    switch (acao) {
      case 'atribuir-coordenacao':
        console.log("🏢 Processando atribuição de coordenação...")
        if (!coordenacaoId || !coordenacaoNome) {
          console.log("❌ Coordenação obrigatória não fornecida")
          return NextResponse.json({ 
            success: false, 
            error: "Coordenação é obrigatória para atribuição" 
          }, { status: 400 })
        }
        
        // Trabalhar com array de coordenações
        const coordenacoesAtuais = usuarioData.coordenacoes || []
        const jaTemCoordenacao = coordenacoesAtuais.some((coord: any) => coord.id === coordenacaoId)
        
        if (jaTemCoordenacao) {
          console.log("⚠️ Usuário já possui esta coordenação")
          return NextResponse.json({ 
            success: false, 
            error: "Usuário já possui esta coordenação" 
          }, { status: 400 })
        }
        
        // Adicionar nova coordenação ao array
        const novasCoordenacoes = [...coordenacoesAtuais, { id: coordenacaoId, nome: coordenacaoNome }]
        updateData.coordenacoes = novasCoordenacoes
        
        // Manter compatibilidade com campos legados
        updateData.coordenacaoId = coordenacaoId
        updateData.coordenacaoNome = coordenacaoNome
        
        // Definir automaticamente como colaborador se não tiver tipo definido
        if (!usuarioData.tipoColaborador) {
          updateData.tipoColaborador = 'administrativo'
          console.log("👤 Definindo tipo colaborador como 'administrativo' automaticamente")
        }
        
        // Garantir que o usuário tenha o nível colaborador
        if (!usuarioData.niveisHierarquicos?.includes('colaborador')) {
          const niveisAtuais = usuarioData.niveisHierarquicos || []
          updateData.niveisHierarquicos = [...niveisAtuais, 'colaborador']
          updateData.nivelAtivo = 'colaborador'
          console.log("🎯 Adicionando nível 'colaborador' automaticamente")
        }
        
        console.log("✅ Atribuindo coordenação:", coordenacaoNome, "Total coordenações:", novasCoordenacoes.length)
        break

      case 'remover-coordenacao':
        console.log("🗑️ Processando remoção de coordenação...")
        if (!coordenacaoId) {
          console.log("❌ ID da coordenação não fornecido para remoção")
          return NextResponse.json({ 
            success: false, 
            error: "ID da coordenação é obrigatório para remoção" 
          }, { status: 400 })
        }
        
        // Remover coordenação específica do array
        const coordenacoesParaRemover = usuarioData.coordenacoes || []
        const coordenacoesRestantes = coordenacoesParaRemover.filter((coord: any) => coord.id !== coordenacaoId)
        
        updateData.coordenacoes = coordenacoesRestantes
        
        // Atualizar campos legados
        if (coordenacoesRestantes.length > 0) {
          // Se ainda tem coordenações, definir a primeira como principal
          updateData.coordenacaoId = coordenacoesRestantes[0].id
          updateData.coordenacaoNome = coordenacoesRestantes[0].nome
        } else {
          // Se não tem mais coordenações, limpar campos legados
          updateData.coordenacaoId = null
          updateData.coordenacaoNome = null
        }
        
        console.log("✅ Coordenação removida. Coordenações restantes:", coordenacoesRestantes.length)
        break

      case 'definir-tipo-colaborador':
        if (!tipoColaborador || !['docente', 'administrativo'].includes(tipoColaborador)) {
          return NextResponse.json({ 
            success: false, 
            error: "Tipo de colaborador inválido" 
          }, { status: 400 })
        }
        
        updateData.tipoColaborador = tipoColaborador
        console.log("👤 Definindo tipo:", tipoColaborador)
        break

      default:
        console.log("❌ Ação não reconhecida:", acao)
        return NextResponse.json({ 
          success: false, 
          error: `Ação inválida: ${acao}. Ações válidas: atribuir-coordenacao, remover-coordenacao, definir-tipo-colaborador` 
        }, { status: 400 })
    }

    // Atualizar usuário
    console.log("💾 Atualizando usuário com dados:", updateData)
    await usuarioDoc.ref.update(updateData)

    console.log("✅ Usuário atualizado com sucesso")

    return NextResponse.json({ 
      success: true, 
      message: "Usuário atualizado com sucesso",
      updateData: updateData 
    })

  } catch (error) {
    console.error("💥 Erro ao atualizar usuário:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("💥 Detalhes do erro:", errorMessage)
    console.error("💥 Stack trace:", error instanceof Error ? error.stack : 'N/A')
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || "Erro interno do servidor ao atualizar usuário",
      details: error instanceof Error ? error.stack : String(error),
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    console.log("🔍 API usuarios-coordenacoes GET iniciada")
    
    // Verificar autenticação passando a requisição
    console.log("🔐 Verificando autenticação...")
    const authResult = await verificarAutenticacao(req as any)
    console.log("🔍 Resultado da autenticação:", { 
      success: authResult.success, 
      error: authResult.error,
      usuarioEmail: authResult.usuario?.email,
      niveis: authResult.usuario?.niveisHierarquicos
    })
    
    if (!authResult.success) {
      console.log("❌ Autenticação falhou:", authResult.error)
      return NextResponse.json({ 
        success: false,
        error: authResult.error || "Autenticação falhou"
      }, { status: authResult.status || 401 })
    }

    // Verificar se é administrador ou coordenador
    const usuario = authResult.usuario!
    const isAdmin = usuario.niveisHierarquicos?.includes('administrador')
    const isCoordenador = usuario.niveisHierarquicos?.includes('coordenador')
    const nivelAtivo = usuario.nivelAtivo
    
    console.log("👤 Verificação de permissões:", { 
      isAdmin, 
      isCoordenador, 
      nivelAtivo,
      email: usuario.email,
      niveis: usuario.niveisHierarquicos
    })

    if (!isAdmin && !isCoordenador) {
      console.log("❌ Acesso negado - usuário não é admin nem coordenador")
      return NextResponse.json({ 
        success: false,
        error: "Acesso negado - você precisa ser administrador ou coordenador"
      }, { status: 403 })
    }

    let usuariosQuery: FirebaseFirestore.Query = adminDb.collection('usuarios')

    // Se for coordenador (incluindo quando é o nível ativo), aplicar filtro rigoroso
    if (isCoordenador && (nivelAtivo === 'coordenador' || (!isAdmin && nivelAtivo !== 'administrador'))) {
      // Usar a mesma função que a interface "Minhas Coordenações" usa
      const { getCoordenacoesDoCoordenador } = await import('@/lib/firebaseDb')
      const coordenacoesAtivas = await getCoordenacoesDoCoordenador(usuario.email)
      
      console.log("📋 Coordenações ativas encontradas para o coordenador:", {
        email: usuario.email,
        coordenacoes: coordenacoesAtivas,
        quantidade: coordenacoesAtivas.length,
        nivelAtivo: nivelAtivo
      })

      // Se não tem coordenações ativas, retornar lista vazia
      if (coordenacoesAtivas.length === 0) {
        console.log("❌ Coordenador sem coordenações ativas - retornando lista vazia")
        return NextResponse.json({ 
          success: true, 
          usuarios: [],
          message: "Coordenador não possui coordenações ativas atribuídas"
        })
      }

      // Filtrar usuários pelas coordenações ativas
      const coordenacoesIds = coordenacoesAtivas.map(coord => coord.id)
      console.log("🔍 Filtrando usuários pelas coordenações ativas:", coordenacoesIds)
      usuariosQuery = usuariosQuery.where('coordenacaoId', 'in', coordenacoesIds)
    }

    console.log("📊 Executando query do Firebase...")
    console.log("🔍 Tipo de usuário fazendo a consulta:", { isAdmin, isCoordenador })
    
    const usuariosSnapshot = await usuariosQuery.get()
    console.log("📋 Documentos encontrados:", usuariosSnapshot.size)
    
    const usuarios = usuariosSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[]

    console.log("✅ Usuários processados:", usuarios.length)
    console.log("📝 Emails dos usuários retornados:", usuarios.map(u => u.email))
    console.log("👥 Retornando resposta de sucesso")

    return NextResponse.json({ 
      success: true, 
      usuarios,
      isAdmin,
      total: usuarios.length
    })

  } catch (error) {
    console.error("💥 Erro ao buscar usuários:", error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error("💥 Detalhes do erro:", errorMessage)
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage || "Erro interno do servidor",
      details: error instanceof Error ? error.stack : String(error)
    }, { status: 500 })
  }
}