import { PaginatedResponse } from "./common.types";

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  produtoId: string;
  produtoNome: string;
  tipoCobranca: TipoCobranca;
  valor: number;
  limiteUsuarios: number | null;
  trial: boolean;
  diasTrial: number;
  recursos: string[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoCobranca = "USUARIO" | "RECURSO" | "VOLUME" | "FIXO";

export interface CreatePlanoDTO {
  nome: string;
  descricao: string;
  produtoId: string;
  tipoCobranca: TipoCobranca;
  valor: number;
  limiteUsuarios?: number | null;
  trial: boolean;
  diasTrial: number;
  recursos?: string[];
}

export interface UpdatePlanoDTO {
  nome?: string;
  descricao?: string;
  tipoCobranca?: TipoCobranca;
  valor?: number;
  limiteUsuarios?: number | null;
  trial?: boolean;
  diasTrial?: number;
  recursos?: string[];
  ativo?: boolean;
}

export type PlanoListResponse = PaginatedResponse<Plano>;
