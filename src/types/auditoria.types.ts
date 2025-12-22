import { PaginatedResponse } from "./common.types";

export interface LogAuditoria {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  ip: string;
  userAgent: string;
  dataHora: string;
}

export type LogListResponse = PaginatedResponse<LogAuditoria>;
