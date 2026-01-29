// Script para corrigir horarios de ponto registrados com fuso errado (UTC em vez de UTC-4)
// Uso: node scripts/fixPontoTimezone.js email@usuario.com
// Requer: variáveis de ambiente do Firebase configuradas (.env.local)

// Carregar .env.local manualmente
const fs = require('fs')
const path = require('path')
const envPath = path.join(__dirname, '..', '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
envContent.split('\n').forEach(line => {
  const trimmed = line.trim()
  if (!trimmed || trimmed.startsWith('#')) return
  const eqIndex = trimmed.indexOf('=')
  if (eqIndex === -1) return
  const key = trimmed.slice(0, eqIndex)
  let value = trimmed.slice(eqIndex + 1)
  // Remover aspas
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1)
  }
  if (!process.env[key]) process.env[key] = value
})

const admin = require('firebase-admin')

const serviceAccount = {
  type: 'service_account',
  project_id: process.env.FIREBASE_PROJECT_ID || 'sistema-ponto-modular-5f1e8',
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_CLIENT_EMAIL}`,
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || 'sistema-ponto-modular-5f1e8',
  })
}

const db = admin.firestore()

// Subtrai 4 horas de um horario "HH:MM"
function corrigirHora(hora) {
  if (!hora) return null
  const [h, m] = hora.split(':').map(Number)
  let novaHora = h - 4
  if (novaHora < 0) novaHora += 24
  return `${String(novaHora).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

async function fixPontos(email) {
  try {
    const hoje = new Date().toLocaleDateString('en-CA', { timeZone: 'America/Manaus' })
    console.log(`Buscando registros de ${email} para hoje (${hoje})...`)

    const snapshot = await db
      .collection('pontos')
      .where('funcionarioEmail', '==', email)
      .where('data', '==', hoje)
      .get()

    if (snapshot.empty) {
      console.log('Nenhum registro encontrado para hoje.')
      return
    }

    for (const doc of snapshot.docs) {
      const data = doc.data()
      console.log(`\nRegistro encontrado (ID: ${doc.id}):`)
      console.log(`  horaEntrada: ${data.horaEntrada}`)
      console.log(`  horaSaida: ${data.horaSaida}`)
      console.log(`  inicioAlmoco: ${data.inicioAlmoco}`)
      console.log(`  fimAlmoco: ${data.fimAlmoco}`)
      console.log(`  inicioHtp: ${data.inicioHtp}`)
      console.log(`  fimHtp: ${data.fimHtp}`)

      const updates = {}

      if (data.horaEntrada) {
        updates.horaEntrada = corrigirHora(data.horaEntrada)
      }
      if (data.horaSaida) {
        updates.horaSaida = corrigirHora(data.horaSaida)
      }
      if (data.inicioAlmoco) {
        updates.inicioAlmoco = corrigirHora(data.inicioAlmoco)
      }
      if (data.fimAlmoco) {
        updates.fimAlmoco = corrigirHora(data.fimAlmoco)
      }
      if (data.inicioHtp) {
        updates.inicioHtp = corrigirHora(data.inicioHtp)
      }
      if (data.fimHtp) {
        updates.fimHtp = corrigirHora(data.fimHtp)
      }

      updates.updatedAt = new Date()

      console.log(`\nCorrigindo para:`)
      Object.entries(updates).forEach(([key, val]) => {
        if (key !== 'updatedAt') console.log(`  ${key}: ${val}`)
      })

      await db.collection('pontos').doc(doc.id).update(updates)
      console.log(`\nRegistro ${doc.id} atualizado com sucesso!`)
    }
  } catch (error) {
    console.error('Erro:', error)
  }
}

const email = process.argv[2]
if (!email) {
  console.log('Uso: node scripts/fixPontoTimezone.js email@usuario.com')
  process.exit(1)
}

fixPontos(email)
  .then(() => {
    console.log('\nConcluido!')
    process.exit(0)
  })
  .catch(error => {
    console.error('Erro fatal:', error)
    process.exit(1)
  })
