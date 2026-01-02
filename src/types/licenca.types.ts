import { PaginatedResponse, Status } from "./common.types";

export interface Licenca {
  id: string;
  chave: string;
  clienteId: string;
  clienteNome: string;
  clienteCodigoCrm: string;
  produtoId: string;
  produtoNome: string;
  planoId: string;
  planoNome: string;
  status: Status;
  dataInicio: string;
  dataExpiracao: string;
  limiteUsuarios: number | null;
  usuariosAtivos: number;
  limiteDispositivos: number | null;
  dispositivosAtivos: number;
  tipoControle: "USUARIO" | "DISPOSITIVO";
  tipoCobranca?: string;
  tagProduto: string;
  usuarioPrincipalId?: string | null;
  usuarioPrincipalNome?: string | null;
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
  limiteDispositivos?: number | null;
  tipoControle: "USUARIO" | "DISPOSITIVO";
  usuarioPrincipalId?: string | null;
  metadata?: Record<string, any>;
}

export interface UpdateLicencaDTO {
  status?: Status;
  dataExpiracao?: string;
  limiteUsuarios?: number | null;
  limiteDispositivos?: number | null;
  usuarioPrincipalId?: string | null;
  metadata?: Record<string, any>;
}

export interface RenovarLicencaDTO {
  meses: number;
}

export type LicencaListResponse = PaginatedResponse<Licenca>;
