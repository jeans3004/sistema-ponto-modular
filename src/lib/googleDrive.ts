import { google } from 'googleapis'

// Autenticação via Service Account (reutiliza credenciais do Firebase)
export function getDriveClient() {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY
    ?.replace(/^"/, '')
    .replace(/"$/, '')
    .replace(/\\n/g, '\n')

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive'],
  })

  return google.drive({ version: 'v3', auth })
}

// IDs do Shared Drive
export function getDriveConfig() {
  return {
    sharedDriveId: process.env.GOOGLE_DRIVE_SHARED_DRIVE_ID || '',
    parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || '', // SistemaDePontoModular
    ausenciasFolderId: process.env.GOOGLE_DRIVE_AUSENCIAS_FOLDER_ID || '',
  }
}

// Buscar ou criar uma pasta dentro do Shared Drive
export async function getOrCreateFolder(
  parentFolderId: string,
  folderName: string
): Promise<string> {
  const drive = getDriveClient()
  const { sharedDriveId } = getDriveConfig()

  // Buscar pasta existente
  const query = `name='${folderName}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const existing = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
    driveId: sharedDriveId,
    corpora: 'drive',
  })

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!
  }

  // Criar pasta nova
  const folder = await drive.files.create({
    requestBody: {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
    supportsAllDrives: true,
  })

  return folder.data.id!
}

// Criar uma nova pasta dentro de SistemaDePontoModular
// Uso: quando o sistema precisar criar novas pastas (relatórios, backups, etc.)
export async function createSystemFolder(folderName: string): Promise<string> {
  const { parentFolderId } = getDriveConfig()
  if (!parentFolderId) {
    throw new Error('GOOGLE_DRIVE_PARENT_FOLDER_ID não configurado')
  }
  return getOrCreateFolder(parentFolderId, folderName)
}
