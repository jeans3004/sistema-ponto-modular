import { adminDb } from './firebaseAdmin'
import { Usuario, NivelHierarquico, PERMISSOES_SISTEMA } from '@/types/usuario'

// Collection do Firestore
const COLLECTION_USUARIOS = 'usuarios'

// Função para criar ou atualizar usuário no primeiro login
export async function criarOuAtualizarUsuario(
  email: string,
  nome: string,
  foto?: string
): Promise<Usuario> {
  try {
    // Verificar se usuário já existe
    const usuarioRef = adminDb.collection(COLLECTION_USUARIOS).doc(email)
    const usuarioDoc = await usuarioRef.get()

    if (usuarioDoc.exists) {
      // Atualizar último acesso
      await usuarioRef.update({
        ultimoAcesso: new Date(),
        ...(foto && { foto }), // Atualizar foto se fornecida
      })

      return { id: usuarioDoc.id, ...usuarioDoc.data() } as Usuario
    } else {
      // Criar novo usuário - por padrão como colaborador pendente
      const novoUsuario: Omit<Usuario, 'id'> = {
        email,
        nome,
        foto,
        niveisHierarquicos: ['colaborador'],
        nivelAtivo: 'colaborador',
        status: 'pendente', // Precisa de aprovação
        dataCadastro: new Date(),
        ultimoAcesso: new Date(),
      }

      await usuarioRef.set(novoUsuario)
      
      return { id: email, ...novoUsuario } as Usuario
    }
  } catch (error) {
    console.error('Erro ao criar/atualizar usuário:', error)
    throw error
  }
}

// Função para obter usuário por email
export async function obterUsuario(email: string): Promise<Usuario | null> {
  try {
    const usuarioDoc = await adminDb.collection(COLLECTION_USUARIOS).doc(email).get()
    
    if (!usuarioDoc.exists) {
      return null
    }

    return { id: usuarioDoc.id, ...usuarioDoc.data() } as Usuario
  } catch (error) {
    console.error('Erro ao obter usuário:', error)
    return null
  }
}

// Função para listar todos os usuários (Admin)
export async function listarUsuarios(): Promise<Usuario[]> {
  try {
    const snapshot = await adminDb.collection(COLLECTION_USUARIOS).get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Usuario[]
  } catch (error) {
    console.error('Erro ao listar usuários:', error)
    return []
  }
}

// Função para listar usuários pendentes (Admin)
export async function listarUsuariosPendentes(): Promise<Usuario[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTION_USUARIOS)
      .where('status', '==', 'pendente')
      .get()
    
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Usuario[]
  } catch (error) {
    console.error('Erro ao listar usuários pendentes:', error)
    return []
  }
}

// Função para aprovar usuário (Admin)
export async function aprovarUsuario(
  emailUsuario: string,
  emailAdmin: string,
  niveisIniciais: NivelHierarquico[] = ['colaborador']
): Promise<void> {
  try {
    await adminDb.collection(COLLECTION_USUARIOS).doc(emailUsuario).update({
      status: 'ativo',
      niveisHierarquicos: niveisIniciais,
      nivelAtivo: niveisIniciais[0],
      aprovadoPor: emailAdmin,
      dataAprovacao: new Date(),
    })
  } catch (error) {
    console.error('Erro ao aprovar usuário:', error)
    throw error
  }
}

// Função para rejeitar usuário (Admin)
export async function rejeitarUsuario(emailUsuario: string): Promise<void> {
  try {
    await adminDb.collection(COLLECTION_USUARIOS).doc(emailUsuario).update({
      status: 'inativo',
    })
  } catch (error) {
    console.error('Erro ao rejeitar usuário:', error)
    throw error
  }
}

// Função para alterar níveis de um usuário (Admin)
export async function alterarNiveisUsuario(
  emailUsuario: string,
  novosNiveis: NivelHierarquico[],
  emailAdmin: string
): Promise<void> {
  try {
    // Se o nível atual não está mais na lista, mudar para o primeiro da nova lista
    const usuario = await obterUsuario(emailUsuario)
    const novoNivelAtivo = usuario && novosNiveis.includes(usuario.nivelAtivo) 
      ? usuario.nivelAtivo 
      : novosNiveis[0]

    await adminDb.collection(COLLECTION_USUARIOS).doc(emailUsuario).update({
      niveisHierarquicos: novosNiveis,
      nivelAtivo: novoNivelAtivo,
      alteradoPor: emailAdmin,
      dataAlteracao: new Date(),
    })
  } catch (error) {
    console.error('Erro ao alterar níveis do usuário:', error)
    throw error
  }
}

// Função para trocar nível ativo do usuário
export async function trocarNivelAtivo(
  emailUsuario: string,
  novoNivel: NivelHierarquico
): Promise<void> {
  try {
    // Verificar se o usuário tem permissão para esse nível
    const usuario = await obterUsuario(emailUsuario)
    
    if (!usuario || !usuario.niveisHierarquicos.includes(novoNivel)) {
      throw new Error('Usuário não tem permissão para este nível hierárquico')
    }

    await adminDb.collection(COLLECTION_USUARIOS).doc(emailUsuario).update({
      nivelAtivo: novoNivel,
      ultimoAcesso: new Date(),
    })
  } catch (error) {
    console.error('Erro ao trocar nível ativo:', error)
    throw error
  }
}

// Função para definir horários de trabalho (Coordenador)
export async function definirHorarioTrabalho(
  emailFuncionario: string,
  horarios: {
    entrada: string
    saida: string
    inicioAlmoco: string
    fimAlmoco: string
  },
  emailCoordenador: string
): Promise<void> {
  try {
    await adminDb.collection(COLLECTION_USUARIOS).doc(emailFuncionario).update({
      configuracoes: {
        horarioTrabalho: horarios,
        definidoPor: emailCoordenador,
        dataDefinicao: new Date(),
      },
    })
  } catch (error) {
    console.error('Erro ao definir horário de trabalho:', error)
    throw error
  }
}

// Função para verificar permissão
export function verificarPermissao(
  usuario: Usuario | null,
  permissao: keyof typeof PERMISSOES_SISTEMA.administrador.permissoes
): boolean {
  if (!usuario || usuario.status !== 'ativo') {
    return false
  }

  const permissoesNivel = PERMISSOES_SISTEMA[usuario.nivelAtivo]
  return permissoesNivel.permissoes[permissao]
}

// Função para verificar se usuário tem nível específico
export function temNivel(usuario: Usuario | null, nivel: NivelHierarquico): boolean {
  if (!usuario || usuario.status !== 'ativo') {
    return false
  }

  return usuario.niveisHierarquicos.includes(nivel)
}

// Função para obter funcionários (para coordenadores)
export async function obterFuncionarios(): Promise<Usuario[]> {
  try {
    const snapshot = await adminDb
      .collection(COLLECTION_USUARIOS)
      .where('status', '==', 'ativo')
      .get()
    
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() } as Usuario))
      .filter(usuario => usuario.niveisHierarquicos.includes('colaborador'))
  } catch (error) {
    console.error('Erro ao obter funcionários:', error)
    return []
  }
}