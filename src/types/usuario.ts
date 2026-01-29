// Tipos para o sistema de usuários e hierarquia

export type NivelHierarquico = 'administrador' | 'coordenador' | 'colaborador'

export interface Usuario {
  id: string
  email: string
  nome: string
  foto?: string
  niveisHierarquicos: NivelHierarquico[] // Array para múltiplos níveis
  nivelAtivo: NivelHierarquico // Nível atual selecionado
  status: 'pendente' | 'ativo' | 'inativo'
  aprovadoPor?: string // Email do admin que aprovou
  dataAprovacao?: Date
  dataCadastro: Date
  ultimoAcesso?: Date
  // Configurações específicas para colaborador
  configuracoes?: {
    horarioTrabalho?: {
      entrada: string // HH:MM
      saida: string // HH:MM
      inicioAlmoco: string // HH:MM
      fimAlmoco: string // HH:MM
    }
    definidoPor?: string // Email do coordenador que definiu
    dataDefinicao?: Date
  }
}

export interface PermissaoNivel {
  nivel: NivelHierarquico
  permissoes: {
    // Gestão de usuários
    gerenciarUsuarios: boolean
    aprovarUsuarios: boolean
    alterarNiveis: boolean
    
    // Gestão de pontos
    verTodosPontos: boolean
    editarPontos: boolean
    excluirPontos: boolean
    
    // Gestão de horários
    definirHorarios: boolean
    verHorarios: boolean
    
    // Relatórios
    gerarRelatorios: boolean
    verRelatoriosGerais: boolean
    
    // Sistema
    configurarSistema: boolean
    verLogs: boolean
  }
}

// Configurações de permissões por nível
export const PERMISSOES_SISTEMA: Record<NivelHierarquico, PermissaoNivel> = {
  administrador: {
    nivel: 'administrador',
    permissoes: {
      gerenciarUsuarios: true,
      aprovarUsuarios: true,
      alterarNiveis: true,
      verTodosPontos: true,
      editarPontos: true,
      excluirPontos: true,
      definirHorarios: true,
      verHorarios: true,
      gerarRelatorios: true,
      verRelatoriosGerais: true,
      configurarSistema: true,
      verLogs: true,
    },
  },
  coordenador: {
    nivel: 'coordenador',
    permissoes: {
      gerenciarUsuarios: false,
      aprovarUsuarios: false,
      alterarNiveis: false,
      verTodosPontos: true,
      editarPontos: false,
      excluirPontos: false,
      definirHorarios: true,
      verHorarios: true,
      gerarRelatorios: true,
      verRelatoriosGerais: true,
      configurarSistema: false,
      verLogs: false,
    },
  },
  colaborador: {
    nivel: 'colaborador',
    permissoes: {
      gerenciarUsuarios: false,
      aprovarUsuarios: false,
      alterarNiveis: false,
      verTodosPontos: false,
      editarPontos: false,
      excluirPontos: false,
      definirHorarios: false,
      verHorarios: false,
      gerarRelatorios: false,
      verRelatoriosGerais: false,
      configurarSistema: false,
      verLogs: false,
    },
  },
}

// Labels para exibição
export const LABELS_NIVEIS: Record<NivelHierarquico, string> = {
  administrador: 'Administrador',
  coordenador: 'Coordenador',
  colaborador: 'Colaborador',
}

// Cores para cada nível
export const CORES_NIVEIS: Record<NivelHierarquico, string> = {
  administrador: 'bg-red-100 text-red-800 border-red-200',
  coordenador: 'bg-blue-100 text-blue-800 border-blue-200',
  colaborador: 'bg-green-100 text-green-800 border-green-200',
}