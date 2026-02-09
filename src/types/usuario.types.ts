import { PaginatedResponse, Status } from "./common.types";
import { UserRole } from "./auth.types";

export type UsuarioTipo = "INTERNO" | "CLIENTE";

export interface UsuarioVinculo {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteCodigoCrm: string;
  licencaId?: string;
  licencaChave?: string;
  produtoNome?: string;
  tagProduto?: string;
  role: UserRole;
  ativo: boolean;
  criadoEm: string;
}

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  tipo: UsuarioTipo;
  role: UserRole; // Para usuários internos, define o nível de acesso ao Núcleo Admin
  ativo: boolean;
  excluido: boolean;
  avatar?: string;
  telefone?: string;
  ultimoAcesso?: string;
  vinculos: UsuarioVinculo[];
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  tipo: UsuarioTipo;
  role: UserRole;
  telefone?: string;
  avatar?: string;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  senha?: string;
  tipo?: UsuarioTipo;
  role?: UserRole;
  ativo?: boolean;
  telefone?: string;
  avatar?: string;
}

export interface UsuarioVinculoDTO {
  clienteId: string;
  licencaId?: string;
  role: UserRole;
}

export interface ResetPasswordDTO {
  novaSenha: string;
}

export type UsuarioListResponse = PaginatedResponse<Usuario>;
