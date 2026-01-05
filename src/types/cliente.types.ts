import { PaginatedResponse, Status } from "./common.types";

export interface ClienteContato {
  id?: string;
  tipo: "EMAIL" | "TELEFONE";
  valor: string;
  isWhatsapp: boolean;
  isPrincipal: boolean;
}

export interface Cliente {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  codigoCrm: string;
  tipo: "PF" | "PJ";
  contatos: ClienteContato[];
  endereco?: Endereco;
  status: Status;
  observacoes?: string;
  logo?: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface Endereco {
  cep: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  estado: string;
  uf?: string;
  pais: string;
}

export interface CreateClienteDTO {
  razaoSocial: string;
  nomeFantasia?: string;
  documento: string;
  inscricaoEstadual?: string;
  inscricaoMunicipal?: string;
  tipo: "PF" | "PJ";
  contatos?: ClienteContato[];
  endereco?: Endereco;
  observacoes?: string;
}

export interface UpdateClienteDTO extends Partial<CreateClienteDTO> {
  status?: Status;
}

export type ClienteListResponse = PaginatedResponse<Cliente>;
