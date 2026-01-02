export enum TipoDispositivo {
  CELULAR = "CELULAR",
  COMPUTADOR = "COMPUTADOR",
  TABLET = "TABLET",
  OUTRO = "OUTRO",
}

export enum StatusDispositivo {
  ATIVO = "ATIVO",
  BLOQUEADO = "BLOQUEADO",
}

export interface Dispositivo {
  id: string;
  deviceId: string;
  apelido: string;
  tipo: TipoDispositivo;
  status: StatusDispositivo;
  licencaId: string;
  licencaChave: string;
  usuarioId: string;
  usuarioNome: string;
  registradoEm: string;
  ultimoAcesso: string;
}

export interface RegistrarDispositivoRequest {
  email: string;
  deviceId: string;
  apelido: string;
  tipo: TipoDispositivo;
}

export interface ValidacaoDispositivoResponse {
  autorizado: boolean;
  mensagem: string;
  dispositivoId?: string;
  licencaId?: string;
  licencaChave?: string;
  dispositivosAtivos?: number;
  limiteDispositivos?: number;
}

export interface UpdateDispositivoRequest {
  apelido?: string;
  tipo?: TipoDispositivo;
  status?: StatusDispositivo;
}
