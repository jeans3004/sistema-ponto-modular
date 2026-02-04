import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { SYSTEM_CONFIG } from '@/lib/config'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.accessToken) {
      return NextResponse.json(
        { success: false, error: 'Não autenticado ou token de acesso indisponível' },
        { status: 401 }
      )
    }

    const folderId = SYSTEM_CONFIG.GOOGLE_DRIVE.AUSENCIAS_FOLDER_ID
    if (!folderId) {
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

    // Ler o conteúdo do arquivo
    const fileBuffer = Buffer.from(await file.arrayBuffer())

    // Montar upload multipart para Google Drive API
    const metadata = {
      name: file.name,
      parents: [folderId],
    }

    const boundary = 'drive_upload_boundary'
    const delimiter = `\r\n--${boundary}\r\n`
    const closeDelimiter = `\r\n--${boundary}--`

    const metadataPart =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata)

    const mediaPart =
      delimiter +
      `Content-Type: ${file.type}\r\n` +
      'Content-Transfer-Encoding: base64\r\n\r\n'

    const body = Buffer.concat([
      Buffer.from(metadataPart, 'utf-8'),
      Buffer.from(mediaPart, 'utf-8'),
      Buffer.from(fileBuffer.toString('base64'), 'utf-8'),
      Buffer.from(closeDelimiter, 'utf-8'),
    ])

    // Upload para Google Drive
    const uploadUrl = new URL('https://www.googleapis.com/upload/drive/v3/files')
    uploadUrl.searchParams.set('uploadType', 'multipart')
    uploadUrl.searchParams.set('supportsAllDrives', 'true')
    uploadUrl.searchParams.set('includeItemsFromAllDrives', 'true')
    uploadUrl.searchParams.set('fields', 'id,name,webViewLink')

    const uploadResponse = await fetch(uploadUrl.toString(), {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    })

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json().catch(() => ({}))
      console.error('Erro no upload ao Google Drive:', errorData)
      return NextResponse.json(
        { success: false, error: 'Falha ao enviar arquivo para o Google Drive' },
        { status: 500 }
      )
    }

    const uploadResult = await uploadResponse.json()

    // Setar permissão de leitura pública para o arquivo
    const permissionUrl = `https://www.googleapis.com/drive/v3/files/${uploadResult.id}/permissions?supportsAllDrives=true`
    const permResponse = await fetch(permissionUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role: 'reader',
        type: 'anyone',
      }),
    })

    if (!permResponse.ok) {
      console.error('Aviso: não foi possível definir permissão pública no arquivo')
    }

    return NextResponse.json({
      success: true,
      fileId: uploadResult.id,
      webViewLink: uploadResult.webViewLink || `https://drive.google.com/file/d/${uploadResult.id}/view`,
      fileName: uploadResult.name,
    })
  } catch (error) {
    console.error('Erro no upload:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno ao processar upload' },
      { status: 500 }
    )
  }
}
