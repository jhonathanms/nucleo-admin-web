import { PaginatedResponse } from "./common.types";

export interface RecursoDetalhado {
  nome: string;
  valor: number;
  ativo: boolean;
}

export interface Plano {
  id: string;
  nome: string;
  descricao: string;
  produtoId: string;
  produtoNome: string;
  tipoCobranca: TipoCobranca;
  valor: number; // Valor total calculado ou fixo
  valorBase: number; // Valor fixo inicial (ex: setup ou mensalidade base)
  valorPorUsuario: number; // Valor por cada usuário adicional
  quantidadePacotes: number; // Quantidade de pacotes
  usuariosPorPacote: number; // Usuários por cada pacote
  limiteUsuarios: number | null;
  limiteDispositivos: number | null;
  trial: boolean;
  diasTrial: number;
  recursos: string[];
  recursosDetalhados: RecursoDetalhado[];
  ativo: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

export type TipoCobranca =
  | "USUARIO"
  | "RECURSO"
  | "FIXO"
  | "VOLUME"
  | "PACOTE_USUARIO"
  | "POR_USUARIO"
  | "POR_DISPOSITIVO";

export interface CreatePlanoDTO {
  nome: string;
  descricao: string;
  produtoId: string;
  tipoCobranca: TipoCobranca;
  valor: number;
  valorBase?: number;
  valorPorUsuario?: number;
  quantidadePacotes?: number;
  usuariosPorPacote?: number;
  limiteUsuarios?: number | null;
  limiteDispositivos?: number | null;
  trial: boolean;
  diasTrial: number;
  recursos?: string[];
  recursosDetalhados?: RecursoDetalhado[];
}

export interface UpdatePlanoDTO {
  nome?: string;
  descricao?: string;
  tipoCobranca?: TipoCobranca;
  valor?: number;
  valorBase?: number;
  valorPorUsuario?: number;
  quantidadePacotes?: number;
  usuariosPorPacote?: number;
  limiteUsuarios?: number | null;
  limiteDispositivos?: number | null;
  trial?: boolean;
  diasTrial?: number;
  recursos?: string[];
  recursosDetalhados?: RecursoDetalhado[];
  ativo?: boolean;
}

export type PlanoListResponse = PaginatedResponse<Plano>;
