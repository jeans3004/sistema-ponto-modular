import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"

export async function POST() {
  try {
    console.log("🏗️ Criando coordenação de exemplo...")
    
    if (!adminDb) {
      throw new Error("Firebase Admin não inicializado")
    }

    // Verificar se já existe alguma coordenação
    const existing = await adminDb.collection('coordenacoes').limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({
        success: true,
        message: "Coordenações já existem",
        total: existing.size
      })
    }

    // Criar coordenações de exemplo
    const coordenacoes = [
      {
        nome: "Coordenação Acadêmica",
        descricao: "Responsável pela gestão acadêmica e pedagógica",
        ativo: true,
        createdAt: new Date(),
        createdBy: "sistema"
      },
      {
        nome: "Coordenação Administrativa",
        descricao: "Responsável pela gestão administrativa e operacional", 
        ativo: true,
        createdAt: new Date(),
        createdBy: "sistema"
      },
      {
        nome: "Coordenação de TI",
        descricao: "Responsável pela tecnologia da informação",
        ativo: true,
        createdAt: new Date(),
        createdBy: "sistema"
      }
    ]

    const batch = adminDb.batch()
    const results = []

    for (const coord of coordenacoes) {
      const docRef = adminDb.collection('coordenacoes').doc()
      batch.set(docRef, { id: docRef.id, ...coord })
      results.push({ id: docRef.id, ...coord })
    }

    await batch.commit()

    console.log("✅ Coordenações criadas:", results.length)
    
    return NextResponse.json({ 
      success: true, 
      coordenacoes: results,
      total: results.length,
      message: "Coordenações de exemplo criadas"
    })
  } catch (error) {
    console.error("💥 Erro ao criar coordenações:", error)
    return NextResponse.json({ 
      success: false, 
      error: "Erro ao criar coordenações",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}