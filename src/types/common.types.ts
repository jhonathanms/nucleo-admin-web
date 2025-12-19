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
