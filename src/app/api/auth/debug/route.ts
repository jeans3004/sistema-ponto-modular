import { NextResponse } from 'next/server'

export async function GET() {
  const diagnostico = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL || 'NÃO DEFINIDO',
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'DEFINIDO (' + process.env.NEXTAUTH_SECRET.length + ' chars)' : 'NÃO DEFINIDO',
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ? process.env.GOOGLE_CLIENT_ID.substring(0, 20) + '...' : 'NÃO DEFINIDO',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ? 'DEFINIDO (' + process.env.GOOGLE_CLIENT_SECRET.length + ' chars)' : 'NÃO DEFINIDO',
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID || 'NÃO DEFINIDO',
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL || 'NÃO DEFINIDO',
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
      ? 'DEFINIDO (' + process.env.FIREBASE_PRIVATE_KEY.length + ' chars) - começa com: ' + process.env.FIREBASE_PRIVATE_KEY.substring(0, 30)
      : 'NÃO DEFINIDO',
    FIREBASE_PRIVATE_KEY_ID: process.env.FIREBASE_PRIVATE_KEY_ID ? 'DEFINIDO' : 'NÃO DEFINIDO',
    FIREBASE_CLIENT_ID: process.env.FIREBASE_CLIENT_ID || 'NÃO DEFINIDO',
    NODE_ENV: process.env.NODE_ENV || 'NÃO DEFINIDO',
  }

  // Testar Firebase Admin
  let firebaseStatus = 'NÃO TESTADO'
  try {
    const { adminDb } = await import('@/lib/firebaseAdmin')
    const testQuery = await adminDb.collection('usuarios').limit(1).get()
    firebaseStatus = `OK - conexão funcionando (${testQuery.size} docs retornados)`
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    firebaseStatus = `ERRO: ${errorMessage}`
  }

  return NextResponse.json({
    diagnostico,
    firebaseStatus,
    timestamp: new Date().toISOString(),
  }, { status: 200 })
}
