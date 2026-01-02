import { PaginatedResponse, Status } from "./common.types";

export type StatusTitulo = "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";

export type FormaPagamento =
  | "PIX"
  | "BOLETO"
  | "CARTAO_CREDITO"
  | "CARTAO_DEBITO"
  | "DINHEIRO"
  | "TRANSFERENCIA";

export type Periodicidade = "MENSAL" | "TRIMESTRAL" | "SEMESTRAL" | "ANUAL";

export interface TituloFinanceiro {
  id: string;
  numero: string;
  licencaId: string;
  clienteId: string;
  clienteNome: string;
  clienteCodigoCrm: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  dataBaixa: string | null;
  formaPagamento: FormaPagamento | null;
  observacoes: string | null;
  status: StatusTitulo;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateTituloDTO {
  licencaId: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  // Campos para recorrência
  recorrente?: boolean;
  periodicidade?: Periodicidade;
  quantidadeParcelas?: number;
  vincularLicenca?: boolean;
  // Campos avançados de recorrência
  diaVencimentoPadrao?: number;
  parcelasPersonalizadas?: { dataVencimento: string; valor: number }[];
  periodoCobrancaInicio?: string;
  periodoCobrancaFim?: string;
}

export interface UpdateTituloDTO {
  descricao?: string;
  valor?: number;
  dataVencimento?: string;
  dataPagamento?: string | null;
  dataBaixa?: string | null;
  formaPagamento?: FormaPagamento;
  observacoes?: string;
  status?: StatusTitulo;
}

export interface RegistrarPagamentoDTO {
  dataBaixa: string;
  observacoes?: string;
  formaPagamento: FormaPagamento;
}

export type TituloListResponse = PaginatedResponse<TituloFinanceiro>;
