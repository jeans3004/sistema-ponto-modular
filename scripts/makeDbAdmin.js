// Script para tornar um usuário administrador do banco de dados manualmente
// Execute: node scripts/makeDbAdmin.js email@usuario.com

const admin = require('firebase-admin')

// Configurar Firebase Admin (usar suas credenciais)
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

async function makeDbAdmin(email) {
  try {
    console.log(`🔄 Promovendo ${email} para administrador do banco de dados...`)

    // Obter UID do usuário pelo email
    const userRecord = await admin.auth().getUserByEmail(email)
    const uid = userRecord.uid

    // Adicionar à coleção databaseAdmins
    await db.collection('databaseAdmins').add({ uid, email })

    console.log(`✅ ${email} agora é administrador do banco de dados!`)
  } catch (error) {
    console.error(`❌ Erro ao promover usuário:`, error)
  }
}

// Obter email da linha de comando
const email = process.argv[2]

if (!email) {
  console.log(`❌ Uso: node scripts/makeDbAdmin.js email@usuario.com`)
  process.exit(1)
}

// Validar email
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  console.log(`❌ Email inválido: ${email}`)
  process.exit(1)
}

// Executar
makeDbAdmin(email)
  .then(() => {
    console.log(`🎉 Concluído!`)
    process.exit(0)
  })
  .catch(error => {
    console.error(`💥 Erro fatal:`, error)
    process.exit(1)
  })