import { NextResponse } from "next/server"
import { verificarAutenticacao } from "@/lib/authMiddleware"
import { adminDb } from "@/lib/firebaseAdmin"

export async function GET(req: Request) {
  try {
    console.log("🔍 Iniciando busca de dados da coleção...")
    
    // Verificar autenticação
    console.log("🔐 Verificando autenticação...")
    const authResult = await verificarAutenticacao(req as any)
    console.log("🔍 Resultado da autenticação:", { 
      success: authResult.success, 
      error: authResult.error,
      usuario: authResult.usuario?.email,
      niveis: authResult.usuario?.niveisHierarquicos
    })
    
    if (!authResult.success) {
      console.log("❌ Autenticação falhou:", authResult.error)
      return NextResponse.json({ error: authResult.error }, { status: authResult.status || 401 })
    }
    console.log("✅ Usuário autenticado:", authResult.usuario?.email)

    // Verificar se é administrador OU se está usando nível administrador
    console.log("🛡️ Verificando se é administrador...")
    const isAdmin = authResult.usuario?.niveisHierarquicos?.includes('administrador')
    const isUsingAdminLevel = authResult.usuario?.nivelAtivo === 'administrador'
    
    if (!isAdmin) {
      console.log("❌ Usuário não tem nível administrador")
      return NextResponse.json({ error: "Acesso negado - você precisa ser administrador" }, { status: 403 })
    }
    
    if (!isUsingAdminLevel) {
      console.log("⚠️ Usuário é admin mas não está usando nível administrador")
      return NextResponse.json({ error: "Acesso negado - você precisa estar usando o nível administrador" }, { status: 403 })
    }
    
    console.log("✅ Usuário é administrador e está usando nível administrativo")

    const { searchParams } = new URL(req.url)
    const collectionName = searchParams.get("collection")
    console.log("📚 Coleção solicitada:", collectionName)

    if (!collectionName) {
      return NextResponse.json({ error: "O nome da coleção é obrigatório" }, { status: 400 })
    }

    console.log("🔥 Conectando ao Firebase Admin...")
    if (!adminDb) {
      throw new Error("Firebase Admin não inicializado")
    }

    console.log("📖 Buscando dados da coleção:", collectionName)
    const snapshot = await adminDb.collection(collectionName).get()
    console.log("📊 Documentos encontrados:", snapshot.size)
    
    const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
    console.log("✅ Dados processados com sucesso")
    
    return NextResponse.json(data)
  } catch (error) {
    console.error("💥 Erro ao buscar dados da coleção:", error)
    return NextResponse.json({ 
      error: "Falha ao buscar dados da coleção",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}