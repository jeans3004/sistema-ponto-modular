import { google } from 'googleapis'
import { RegistroPonto, AusenciaJustificada } from '@/types/ponto'
import { SYSTEM_CONFIG } from './config'

// Configuração da autenticação com Google Sheets
const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  },
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
})

const sheets = google.sheets({ version: 'v4', auth })

// Função para obter dados dos funcionários
export async function getFuncionarios() {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Funcionarios!A:E', // Todas as colunas da aba Funcionarios
    })

    const rows = response.data.values || []
    
    // Converter para objeto estruturado (pular primeira linha - cabeçalhos)
    return rows.slice(1).map(row => ({
      id: row[0],
      nome: row[1],
      email: row[2],
      cargo: row[3],
      dataAdmissao: row[4],
    }))
  } catch (error) {
    console.error('Erro ao obter funcionários:', error)
    return []
  }
}

// Função para obter pontos de um funcionário
export async function getPontosFuncionario(funcionarioEmail: string): Promise<RegistroPonto[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pontos!A:L', // Expandido para incluir colunas de almoço e geolocalização
    })

    const rows = response.data.values || []
    
    // Filtrar pontos do funcionário específico
    const pontos = rows.slice(1).map(row => ({
      id: row[0] || '',
      funcionarioEmail: row[1] || '',
      data: row[2] || '',
      horaEntrada: row[3] || undefined,
      horaSaida: row[4] || undefined,
      inicioAlmoco: row[5] || undefined,
      fimAlmoco: row[6] || undefined,
      tempoAlmoco: row[7] || undefined,
      totalHoras: row[8] || undefined,
    })).filter(ponto => ponto.funcionarioEmail === funcionarioEmail)

    return pontos
  } catch (error) {
    console.error('Erro ao obter pontos:', error)
    return []
  }
}

// Interface para dados de localização
interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}

// Função para registrar entrada
export async function registrarEntrada(funcionarioEmail: string, horaEntrada: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const novoId = Date.now().toString() // ID único baseado no timestamp
    
    // Verificar se já existe registro para hoje
    const pontosExistentes = await getPontosFuncionario(funcionarioEmail)
    const registroHoje = pontosExistentes.find(p => p.data === hoje)
    
    if (registroHoje) {
      throw new Error('Já existe um registro de entrada para hoje')
    }

    // Preparar dados para inserir na planilha
    const rowData = [
      novoId, 
      funcionarioEmail, 
      hoje, 
      horaEntrada, 
      '', // horaSaida
      '', // inicioAlmoco
      '', // fimAlmoco
      '', // tempoAlmoco
      '', // totalHoras
      locationData ? locationData.latitude : '', // latitude
      locationData ? locationData.longitude : '', // longitude
      locationData ? locationData.accuracy : '' // accuracy
    ]

    // Adicionar nova linha na planilha (expandido para incluir colunas de geolocalização)
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pontos!A:L', // Expandido para incluir colunas de geolocalização
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    })

    return { success: true, id: novoId }
  } catch (error) {
    console.error('Erro ao registrar entrada:', error)
    throw error
  }
}

// Função para registrar saída
export async function registrarSaida(funcionarioEmail: string, horaSaida: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Obter dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pontos!A:L', // Expandido para incluir colunas de geolocalização
    })

    const rows = response.data.values || []
    
    // Encontrar o registro de hoje
    let linhaParaAtualizar = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === funcionarioEmail && rows[i][2] === hoje && !rows[i][4]) {
        linhaParaAtualizar = i + 1 // +1 porque a API usa indexação 1-based
        break
      }
    }

    if (linhaParaAtualizar === -1) {
      throw new Error('Não foi encontrado registro de entrada para hoje')
    }

    // Calcular horas trabalhadas
    const horaEntrada = rows[linhaParaAtualizar - 1][3]
    const inicioAlmoco = rows[linhaParaAtualizar - 1][5]
    const fimAlmoco = rows[linhaParaAtualizar - 1][6]
    
    let totalHoras = calcularHorasTrabalhadas(horaEntrada, horaSaida)
    
    // Se teve almoço, subtrair o tempo do almoço
    if (inicioAlmoco && fimAlmoco) {
      const tempoAlmoco = calcularMinutosTrabalhados(inicioAlmoco, fimAlmoco)
      const horasTrabalhadasMinutos = calcularMinutosTrabalhados(horaEntrada, horaSaida)
      const totalMinutos = horasTrabalhadasMinutos - tempoAlmoco
      totalHoras = formatarMinutosParaHoras(totalMinutos)
    }

    // Preparar dados para atualização incluindo geolocalização
    const updateData = [
      horaSaida, 
      inicioAlmoco || '', 
      fimAlmoco || '', 
      rows[linhaParaAtualizar - 1][7] || '', 
      totalHoras,
      locationData ? locationData.latitude : rows[linhaParaAtualizar - 1][9] || '', // manter latitude existente se não houver nova
      locationData ? locationData.longitude : rows[linhaParaAtualizar - 1][10] || '', // manter longitude existente se não houver nova
      locationData ? locationData.accuracy : rows[linhaParaAtualizar - 1][11] || '' // manter accuracy existente se não houver nova
    ]

    // Atualizar a linha com saída, total de horas e dados de geolocalização
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Pontos!E${linhaParaAtualizar}:L${linhaParaAtualizar}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [updateData],
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao registrar saída:', error)
    throw error
  }
}

// Função para registrar início do almoço
export async function registrarInicioAlmoco(funcionarioEmail: string, horaInicioAlmoco: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Obter dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pontos!A:L', // Expandido para incluir colunas de geolocalização
    })

    const rows = response.data.values || []
    
    // Encontrar o registro de hoje
    let linhaParaAtualizar = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === funcionarioEmail && rows[i][2] === hoje && rows[i][3] && !rows[i][5]) {
        linhaParaAtualizar = i + 1
        break
      }
    }

    if (linhaParaAtualizar === -1) {
      throw new Error('Não foi encontrado registro de entrada válido para registrar almoço')
    }

    // Atualizar com início do almoço
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Pontos!F${linhaParaAtualizar}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[horaInicioAlmoco]],
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao registrar início do almoço:', error)
    throw error
  }
}

// Função para registrar fim do almoço
export async function registrarFimAlmoco(funcionarioEmail: string, horaFimAlmoco: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Obter dados da planilha
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Pontos!A:L', // Expandido para incluir colunas de geolocalização
    })

    const rows = response.data.values || []
    
    // Encontrar o registro de hoje
    let linhaParaAtualizar = -1
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][1] === funcionarioEmail && rows[i][2] === hoje && rows[i][5] && !rows[i][6]) {
        linhaParaAtualizar = i + 1
        break
      }
    }

    if (linhaParaAtualizar === -1) {
      throw new Error('Não foi encontrado registro de início de almoço para finalizar')
    }

    // Calcular tempo de almoço
    const inicioAlmoco = rows[linhaParaAtualizar - 1][5]
    const tempoAlmoco = calcularHorasTrabalhadas(inicioAlmoco, horaFimAlmoco)

    // Atualizar com fim do almoço e tempo total
    await sheets.spreadsheets.values.update({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: `Pontos!G${linhaParaAtualizar}:H${linhaParaAtualizar}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[horaFimAlmoco, tempoAlmoco]],
      },
    })

    return { success: true }
  } catch (error) {
    console.error('Erro ao registrar fim do almoço:', error)
    throw error
  }
}

// Função para registrar ausência justificada
export async function registrarAusenciaJustificada(
  funcionarioEmail: string, 
  data: string, 
  tipo: string, 
  justificativa: string,
  linkDocumento?: string
) {
  try {
    const novoId = Date.now().toString()
    const dataEnvio = new Date().toISOString()
    
    // Verificar se já existe ausência para esta data
    const ausenciasExistentes = await getAusenciasJustificadas(funcionarioEmail)
    const ausenciaHoje = ausenciasExistentes.find(a => a.data === data)
    
    if (ausenciaHoje) {
      throw new Error('Já existe uma ausência registrada para esta data')
    }

    // Adicionar nova linha na aba de Ausências
    await sheets.spreadsheets.values.append({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Ausencias!A:H',
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [[novoId, funcionarioEmail, data, tipo, justificativa, linkDocumento || '', 'pendente', dataEnvio]],
      },
    })

    return { success: true, id: novoId }
  } catch (error) {
    console.error('Erro ao registrar ausência:', error)
    throw error
  }
}

// Função para obter ausências justificadas
export async function getAusenciasJustificadas(funcionarioEmail: string): Promise<AusenciaJustificada[]> {
  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.GOOGLE_SHEET_ID,
      range: 'Ausencias!A:H',
    })

    const rows = response.data.values || []
    
    return rows.slice(1).map(row => ({
      id: row[0] || '',
      funcionarioEmail: row[1] || '',
      data: row[2] || '',
      tipo: row[3] as 'falta' | 'atestado' | 'licenca',
      justificativa: row[4] || '',
      linkDocumento: row[5] || undefined,
      status: row[6] as 'pendente' | 'aprovada' | 'rejeitada',
      dataEnvio: row[7] || '',
    })).filter(ausencia => ausencia.funcionarioEmail === funcionarioEmail)
  } catch (error) {
    console.error('Erro ao obter ausências:', error)
    return []
  }
}

// Funções auxiliares para cálculos de tempo
function calcularHorasTrabalhadas(horaEntrada: string, horaSaida: string): string {
  const entrada = new Date(`2000-01-01T${horaEntrada}:00`)
  const saida = new Date(`2000-01-01T${horaSaida}:00`)
  
  const diffMs = saida.getTime() - entrada.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  
  const hours = Math.floor(diffHours)
  const minutes = Math.round((diffHours - hours) * 60)
  
  return `${hours}h ${minutes}m`
}

function calcularMinutosTrabalhados(horaEntrada: string, horaSaida: string): number {
  const entrada = new Date(`2000-01-01T${horaEntrada}:00`)
  const saida = new Date(`2000-01-01T${horaSaida}:00`)
  
  const diffMs = saida.getTime() - entrada.getTime()
  return Math.round(diffMs / (1000 * 60))
}

function formatarMinutosParaHoras(minutos: number): string {
  const hours = Math.floor(minutos / 60)
  const mins = minutos % 60
  return `${hours}h ${mins}m`
}
