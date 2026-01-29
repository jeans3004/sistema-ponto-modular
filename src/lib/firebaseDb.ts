import { adminDb } from './firebaseAdmin'
import { RegistroPonto, AusenciaJustificada } from '@/types/ponto'
import { SYSTEM_CONFIG } from './config'

// Interface para dados de localização
interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
}

// Collections do Firestore
const COLLECTIONS = {
  FUNCIONARIOS: 'funcionarios',
  PONTOS: 'pontos',
  AUSENCIAS: 'ausencias',
}

// Função para obter dados dos funcionários
export async function getFuncionarios() {
  try {
    const snapshot = await adminDb.collection(COLLECTIONS.FUNCIONARIOS).get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }))
  } catch (error) {
    console.error('Erro ao obter funcionários:', error)
    return []
  }
}

// Função para obter pontos de um funcionário
export async function getPontosFuncionario(funcionarioEmail: string): Promise<RegistroPonto[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.PONTOS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .get()
    
    const pontos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as RegistroPonto[]
    
    // Ordenar por data no código (já que removemos orderBy do query)
    return pontos.sort((a, b) => b.data.localeCompare(a.data))
  } catch (error) {
    console.error('Erro ao obter pontos:', error)
    return []
  }
}

// Função para registrar entrada
export async function registrarEntrada(funcionarioEmail: string, horaEntrada: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    
    // Verificar se já existe registro para hoje
    const pontosExistentes = await getPontosFuncionario(funcionarioEmail)
    const registroHoje = pontosExistentes.find(p => p.data === hoje)
    
    if (registroHoje) {
      throw new Error('Já existe um registro de entrada para hoje')
    }

    // Preparar dados para inserir no Firestore
    const pontoData = {
      funcionarioEmail,
      data: hoje,
      horaEntrada,
      horaSaida: null,
      inicioAlmoco: null,
      fimAlmoco: null,
      tempoAlmoco: null,
      totalHoras: null,
      latitude: locationData?.latitude || null,
      longitude: locationData?.longitude || null,
      accuracy: locationData?.accuracy || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Adicionar documento no Firestore
    const docRef = await adminDb.collection(COLLECTIONS.PONTOS).add(pontoData)

    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Erro ao registrar entrada:', error)
    throw error
  }
}

// Função para registrar saída
export async function registrarSaida(funcionarioEmail: string, horaSaida: string, locationData?: LocationData) {
  try {
    const hoje = new Date().toISOString().split('T')[0]
    
    // Buscar registros de hoje do funcionário
    const snapshot = await adminDb
      .collection(COLLECTIONS.PONTOS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .where('data', '==', hoje)
      .get()

    // Filtrar no código para evitar índices complexos
    const registroValido = snapshot.docs.find(doc => {
      const data = doc.data()
      return !data.horaSaida // Registro sem saída
    })

    if (!registroValido) {
      throw new Error('Não foi encontrado registro de entrada para hoje')
    }

    const pontoData = registroValido.data()

    // Calcular horas trabalhadas
    let totalHoras = calcularHorasTrabalhadas(pontoData.horaEntrada, horaSaida)
    
    // Se teve almoço, subtrair o tempo do almoço
    if (pontoData.inicioAlmoco && pontoData.fimAlmoco) {
      const tempoAlmoco = calcularMinutosTrabalhados(pontoData.inicioAlmoco, pontoData.fimAlmoco)
      const horasTrabalhadasMinutos = calcularMinutosTrabalhados(pontoData.horaEntrada, horaSaida)
      const totalMinutos = horasTrabalhadasMinutos - tempoAlmoco
      totalHoras = formatarMinutosParaHoras(totalMinutos)
    }

    // Preparar dados para atualização
    const updateData: any = {
      horaSaida,
      totalHoras,
      updatedAt: new Date(),
    }

    // Adicionar dados de localização se fornecidos
    if (locationData) {
      updateData.latitude = locationData.latitude
      updateData.longitude = locationData.longitude
      updateData.accuracy = locationData.accuracy
    }

    // Atualizar documento
    await adminDb.collection(COLLECTIONS.PONTOS).doc(registroValido.id).update(updateData)

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
    
    // Buscar registros de hoje do funcionário
    const snapshot = await adminDb
      .collection(COLLECTIONS.PONTOS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .where('data', '==', hoje)
      .get()

    // Filtrar no código para evitar índices complexos
    const registroValido = snapshot.docs.find(doc => {
      const data = doc.data()
      return data.horaEntrada && !data.inicioAlmoco
    })

    if (!registroValido) {
      throw new Error('Não foi encontrado registro de entrada válido para registrar almoço')
    }

    // Atualizar com início do almoço
    await adminDb.collection(COLLECTIONS.PONTOS).doc(registroValido.id).update({
      inicioAlmoco: horaInicioAlmoco,
      updatedAt: new Date(),
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
    
    // Buscar registros de hoje do funcionário
    const snapshot = await adminDb
      .collection(COLLECTIONS.PONTOS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .where('data', '==', hoje)
      .get()

    // Filtrar no código para evitar índices complexos
    const registroValido = snapshot.docs.find(doc => {
      const data = doc.data()
      return data.inicioAlmoco && !data.fimAlmoco
    })

    if (!registroValido) {
      throw new Error('Não foi encontrado registro de início de almoço para finalizar')
    }

    const pontoData = registroValido.data()

    // Calcular tempo de almoço
    const tempoAlmoco = calcularHorasTrabalhadas(pontoData.inicioAlmoco, horaFimAlmoco)

    // Atualizar com fim do almoço e tempo total
    await adminDb.collection(COLLECTIONS.PONTOS).doc(registroValido.id).update({
      fimAlmoco: horaFimAlmoco,
      tempoAlmoco,
      updatedAt: new Date(),
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
    // Verificar se já existe ausência para esta data
    const snapshot = await adminDb
      .collection(COLLECTIONS.AUSENCIAS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .where('data', '==', data)
      .limit(1)
      .get()
    
    if (!snapshot.empty) {
      throw new Error('Já existe uma ausência registrada para esta data')
    }

    // Preparar dados da ausência
    const ausenciaData = {
      funcionarioEmail,
      data,
      tipo,
      justificativa,
      linkDocumento: linkDocumento || null,
      status: 'pendente',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    // Adicionar documento no Firestore
    const docRef = await adminDb.collection(COLLECTIONS.AUSENCIAS).add(ausenciaData)

    return { success: true, id: docRef.id }
  } catch (error) {
    console.error('Erro ao registrar ausência:', error)
    throw error
  }
}

// Função para obter ausências justificadas
export async function getAusenciasJustificadas(funcionarioEmail: string): Promise<AusenciaJustificada[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTIONS.AUSENCIAS)
      .where('funcionarioEmail', '==', funcionarioEmail)
      .get()
    
    const ausencias = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as AusenciaJustificada[]
    
    // Ordenar por data no código (já que removemos orderBy do query)
    return ausencias.sort((a, b) => b.data.localeCompare(a.data))
  } catch (error) {
    console.error('Erro ao obter ausências:', error)
    return []
  }
}

// Funções auxiliares para cálculos de tempo (mantidas do arquivo original)
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