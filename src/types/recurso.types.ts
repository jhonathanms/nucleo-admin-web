import { PaginatedResponse } from "./common.types";

export interface Recurso {
  id: string;
  nome: string;
  chave: string;
  descricao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateRecursoDTO {
  nome: string;
  chave: string;
  descricao: string;
}

export interface UpdateRecursoDTO {
  nome?: string;
  chave?: string;
  descricao?: string;
  ativo?: boolean;
}

export type RecursoListResponse = PaginatedResponse<Recurso>;
