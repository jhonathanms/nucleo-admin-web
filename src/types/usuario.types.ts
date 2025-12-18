import { PaginatedResponse } from "./common.types";
import { UserRole } from "./auth.types";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  avatar?: string;
  telefone?: string;
  ultimoAcesso?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateUsuarioDTO {
  nome: string;
  email: string;
  senha: string;
  role: UserRole;
  telefone?: string;
  avatar?: string;
  clienteId?: string;
}

export interface UpdateUsuarioDTO {
  nome?: string;
  email?: string;
  role?: UserRole;
  ativo?: boolean;
  telefone?: string;
  avatar?: string;
  clienteId?: string;
}

export interface ResetPasswordDTO {
  novaSenha: string;
}

export type UsuarioListResponse = PaginatedResponse<Usuario>;
