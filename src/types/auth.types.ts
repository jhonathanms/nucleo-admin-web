// Authentication related types

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

export interface User {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  ativo: boolean;
  avatar?: string;
  tema?: "light" | "dark" | "system";
  criadoEm: string;
  atualizadoEm: string;
}

export type UserRole = "ADMIN" | "GERENTE" | "OPERADOR" | "CLIENTE";

export interface UpdateProfileRequest {
  nome?: string;
  email?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  senhaAtual: string;
  novaSenha: string;
}
