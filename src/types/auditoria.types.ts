import { PaginatedResponse } from "./common.types";

export type NivelAuditoria = "INFO" | "WARNING" | "ERROR";

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
  nivel?: NivelAuditoria; // Mantido como opcional caso o backend ainda envie em algum contexto
}

export type LogListResponse = PaginatedResponse<LogAuditoria>;
