import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { google } from 'googleapis'
import { Readable } from 'stream'

// Autenticação via Service Account (reutiliza credenciais do Firebase)
function getDriveClient() {
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

// Buscar ou criar subpasta do funcionário dentro da pasta de ausências
async function getOrCreateUserFolder(
  drive: ReturnType<typeof google.drive>,
  parentFolderId: string,
  userEmail: string
): Promise<string> {
  // Buscar pasta existente
  const query = `name='${userEmail}' and '${parentFolderId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
  const existing = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    supportsAllDrives: true,
    includeItemsFromAllDrives: true,
  })

  if (existing.data.files && existing.data.files.length > 0) {
    return existing.data.files[0].id!
  }

  // Criar pasta nova
  const folder = await drive.files.create({
    requestBody: {
      name: userEmail,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    },
    fields: 'id',
    supportsAllDrives: true,
  })

  return folder.data.id!
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const ausenciasFolderId = process.env.GOOGLE_DRIVE_AUSENCIAS_FOLDER_ID
    if (!ausenciasFolderId) {
      return NextResponse.json(
        { success: false, error: 'Pasta do Google Drive não configurada' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'Nenhum arquivo enviado' },
        { status: 400 }
      )
    }

    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: 'Tipo de arquivo não permitido. Use PDF, JPG ou PNG.' },
        { status: 400 }
      )
    }

    // Validar tamanho (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { success: false, error: 'Arquivo muito grande. Máximo 10MB.' },
        { status: 400 }
      )
    }

    const drive = getDriveClient()

    // Buscar/criar subpasta do funcionário
    const userFolderId = await getOrCreateUserFolder(drive, ausenciasFolderId, session.user.email)

    // Preparar arquivo para upload
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(fileBuffer)

    // Gerar nome com data para organização
    const now = new Date()
    const datePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const fileName = `${datePrefix}_${file.name}`

    // Upload para Google Drive via Service Account
    const uploadResult = await drive.files.create({
      requestBody: {
        name: fileName,
        parents: [userFolderId],
      },
      media: {
        mimeType: file.type,
        body: stream,
      },
      fields: 'id, name, webViewLink',
      supportsAllDrives: true,
    })

    // Definir permissão de leitura pública
    try {
      await drive.permissions.create({
        fileId: uploadResult.data.id!,
        requestBody: {
          role: 'reader',
          type: 'anyone',
        },
        supportsAllDrives: true,
      })
    } catch (permError) {
      console.error('Aviso: não foi possível definir permissão pública:', permError)
    }

    return NextResponse.json({
      success: true,
      fileId: uploadResult.data.id,
      webViewLink: uploadResult.data.webViewLink || `https://drive.google.com/file/d/${uploadResult.data.id}/view`,
      fileName: uploadResult.data.name,
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
