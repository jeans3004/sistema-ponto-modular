// Tipos para o sistema de ponto

export interface Funcionario {
  id: string
  nome: string
  email: string
  cargo: string
  dataAdmissao: string
}

export interface RegistroPonto {
  id: string
  funcionarioEmail: string
  data: string
  horaEntrada?: string
  horaSaida?: string
  inicioAlmoco?: string
  fimAlmoco?: string
  tempoAlmoco?: string // Calculado automaticamente
  totalHoras?: string
  observacoes?: string
}

export interface AusenciaJustificada {
  id: string
  funcionarioEmail: string
  data: string
  tipo: 'falta' | 'atestado' | 'licenca'
  justificativa: string
  linkDocumento?: string
  status: 'pendente' | 'aprovada' | 'rejeitada'
  dataEnvio: string
  dataAnalise?: string
}

export interface StatusPonto {
  entrada: boolean
  saida: boolean
  inicioAlmoco: boolean
  fimAlmoco: boolean
  podeIniciarAlmoco: boolean
  podeFinalizarAlmoco: boolean
}

export interface DashboardData {
  registroHoje?: RegistroPonto
  status: StatusPonto
  estatisticas: {
    horasTrabalhadasMes: string
    diasTrabalhadosMes: number
    mediaHorasDiarias: string
    ausenciasJustificadas: number
  }
}