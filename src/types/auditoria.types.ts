import { PaginatedResponse } from "./common.types";

export type NivelAuditoria = "INFO" | "WARNING" | "ERROR";

export interface LogAuditoria {
  id: string;
  dataHora: string;
  usuario: string;
  usuarioEmail: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  ip: string;
  nivel: NivelAuditoria;
}

export type LogListResponse = PaginatedResponse<LogAuditoria>;
