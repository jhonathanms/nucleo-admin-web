import { PaginatedResponse, Status } from "./common.types";

export interface Licenca {
  id: string;
  chave: string;
  clienteId: string;
  clienteNome: string;
  produtoId: string;
  produtoNome: string;
  planoId: string;
  planoNome: string;
  status: Status;
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios: number | null;
  usuariosAtivos: number;
  metadata?: Record<string, any>;
  criadoEm: string;
  atualizadoEm: string;
}

export interface CreateLicencaDTO {
  clienteId: string;
  produtoId: string;
  planoId: string;
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios?: number | null;
  metadata?: Record<string, any>;
}

export interface UpdateLicencaDTO {
  status?: Status;
  dataExpiracao?: string;
  limiteUsuarios?: number | null;
  metadata?: Record<string, any>;
}

export interface RenovarLicencaDTO {
  meses: number;
}

export type LicencaListResponse = PaginatedResponse<Licenca>;
