import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"

export async function GET() {
  try {
    console.log("🧪 Testando conexão com Firebase Admin...")
    
    // Testar conexão básica
    const testCollection = await adminDb.collection('usuarios').limit(1).get()
    console.log("✅ Conexão com Firebase funcionando")
    console.log("📊 Número de documentos encontrados:", testCollection.size)
    
    return NextResponse.json({ 
      success: true, 
      message: "Firebase Admin funcionando",
      documentsFound: testCollection.size
    })
  } catch (error) {
    console.error("💥 Erro ao testar Firebase:", error)
    return NextResponse.json({ 
      success: false,
      error: "Erro na conexão Firebase",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}