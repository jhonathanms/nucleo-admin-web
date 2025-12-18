import { PaginatedResponse, Status } from "./common.types";

export type StatusTitulo = "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";

export interface TituloFinanceiro {
  id: string;
  numero: string;
  licencaId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: StatusTitulo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateTituloDTO {
  licencaId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
}

export interface UpdateTituloDTO {
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  dataPagamento?: string | null;
  status?: StatusTitulo;
}

export type TituloListResponse = PaginatedResponse<TituloFinanceiro>;
