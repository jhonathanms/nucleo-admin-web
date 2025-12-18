import { PaginatedResponse, Status } from "./common.types";

export interface Cliente {
  id: string;
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  email: string;
  telefone: string;
  endereco?: Endereco;
  status: Status;
  observacoes?: string;
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
  pais: string;
}

export interface CreateClienteDTO {
  nome: string;
  documento: string;
  tipo: "PF" | "PJ";
  email: string;
  telefone: string;
  endereco?: Endereco;
  observacoes?: string;
}

export interface UpdateClienteDTO {
  nome?: string;
  email?: string;
  telefone?: string;
  endereco?: Endereco;
  status?: Status;
  observacoes?: string;
}

export type ClienteListResponse = PaginatedResponse<Cliente>;
