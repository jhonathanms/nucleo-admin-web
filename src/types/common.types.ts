// Common types used across the application

export interface PaginatedResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
  first: boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface ErroDTO {
  codigo: number;
  mensagem: string;
  metadata: any;
}

export class AppError extends Error {
  public readonly errors: ErroDTO[];
  public readonly status: number;

  constructor(errors: ErroDTO[], status: number) {
    super(errors[0]?.mensagem || "Erro desconhecido");
    this.errors = errors;
    this.status = status;
    Object.setPrototypeOf(this, AppError.prototype);
  }

  get firstError(): ErroDTO | undefined {
    return this.errors[0];
  }
}

export interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
  timestamp: string;
  path: string;
}

export interface QueryParams {
  page?: number;
  size?: number;
  sort?: string;
  direction?: "ASC" | "DESC";
  search?: string;
  q?: string;
  [key: string]: any;
}

export type Status =
  | "ATIVO"
  | "INATIVO"
  | "SUSPENSO"
  | "CANCELADO"
  | "TRIAL"
  | "EXPIRADO"
  | "INADIMPLENTE";

export enum ApiErrorCodes {
  TOKEN_INVALIDO = -1,
  TOKEN_EXPIRADO = -2,
  CREDENCIAIS_INVALIDAS = -3,
  USUARIO_INATIVO = -4,
  USUARIO_NAO_ENCONTRADO = -5,
  LICENCA_INATIVA = -6,
  LICENCA_EXPIRADA = -7,
  SEM_LICENCA_PRODUTO = -8,
  SEM_PERMISSAO_ADMIN = -9,
  SESSAO_INVALIDA = -10,
  SESSAO_EXPIRADA = -11,
  TOKEN_REVOGADO = -12,
  SEM_LICENCA_USUARIO = -13,
  LICENCA_NAO_ENCONTRADA = -14,
  USUARIO_INATIVO_LICENCA = -15,
  ENTRADA_DE_DADOS_INVALIDA = -998,
  ERRO_INTERNO_SERVIDOR = -999,
}
