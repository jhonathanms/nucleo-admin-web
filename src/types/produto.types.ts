import { PaginatedResponse } from "./common.types";

export interface Produto {
  id: string;
  nome: string;
  descricao: string;
  tipo: ProdutoTipo;
  versao: string;
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type ProdutoTipo = "WEB" | "API" | "DESKTOP" | "MOBILE";

export interface CreateProdutoDTO {
  nome: string;
  descricao: string;
  tipo: ProdutoTipo;
  versao: string;
}

export interface UpdateProdutoDTO {
  nome?: string;
  descricao?: string;
  tipo?: ProdutoTipo;
  versao?: string;
  ativo?: boolean;
}

export type ProdutoListResponse = PaginatedResponse<Produto>;
