import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDriveClient, getDriveConfig, getOrCreateFolder } from '@/lib/googleDrive'
import { Readable } from 'stream'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado' },
        { status: 401 }
      )
    }

    const { ausenciasFolderId, sharedDriveId } = getDriveConfig()

    if (!ausenciasFolderId || !sharedDriveId) {
      return NextResponse.json(
        { success: false, error: 'Google Drive (Shared Drive) não configurado' },
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

    // Buscar/criar subpasta do funcionário dentro de Ausencias/
    const userFolderId = await getOrCreateFolder(ausenciasFolderId, session.user.email)

    // Preparar arquivo para upload
    const drive = getDriveClient()
    const fileBuffer = Buffer.from(await file.arrayBuffer())
    const stream = Readable.from(fileBuffer)

    // Gerar nome com data para organização
    const now = new Date()
    const datePrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const fileName = `${datePrefix}_${file.name}`

    // Upload para Shared Drive via Service Account
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
