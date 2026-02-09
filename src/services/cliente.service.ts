import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  ClienteListResponse,
  ClienteContato,
} from "@/types/cliente.types";
import { Usuario } from "@/types/usuario.types";

class ClienteService {
  private readonly baseURL = "/clientes";

  /**
   * Get all clientes with pagination
   */
  async getAll(params?: QueryParams): Promise<ClienteListResponse> {
    const response = await api.get<Cliente[] | ClienteListResponse>(
      this.baseURL,
      {
        params,
      }
    );

    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        totalElements: response.data.length,
        totalPages: 1,
        size: response.data.length,
        page: 0,
        first: true,
        last: true,
      };
    }

    return response.data;
  }

  /**
   * Get cliente by ID
   */
  async getById(id: string): Promise<Cliente> {
    const response = await api.get<Cliente>(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new cliente
   */
  async create(data: CreateClienteDTO): Promise<Cliente> {
    const response = await api.post<Cliente>(this.baseURL, data);
    return response.data;
  }

  /**
   * Update cliente
   */
  async update(id: string, data: UpdateClienteDTO): Promise<Cliente> {
    const response = await api.put<Cliente>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete cliente
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Search clientes by name or document
   */
  async search(
    query: string,
    params?: QueryParams
  ): Promise<ClienteListResponse> {
    const response = await api.get<Cliente[] | ClienteListResponse>(
      `${this.baseURL}/search`,
      {
        params: { ...params, q: query },
      }
    );

    if (Array.isArray(response.data)) {
      return {
        content: response.data,
        totalElements: response.data.length,
        totalPages: 1,
        size: response.data.length,
        page: 0,
        first: true,
        last: true,
      };
    }

    return response.data;
  }

  /**
   * Get clientes by status
   */
  async getByStatus(
    status: string,
    params?: QueryParams
  ): Promise<ClienteListResponse> {
    const response = await api.get<ClienteListResponse>(
      `${this.baseURL}/status/${status}`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get users linked to a client
   */
  async getUsuarios(id: string): Promise<Usuario[]> {
    const response = await api.get<Usuario[]>(`${this.baseURL}/${id}/usuarios`);
    return response.data;
  }

  /**
   * Suspend cliente
   */
  async suspend(id: string): Promise<Cliente> {
    const response = await api.patch<Cliente>(`${this.baseURL}/${id}/suspend`);
    return response.data;
  }

  /**
   * Activate cliente
   */
  async activate(id: string): Promise<Cliente> {
    const response = await api.patch<Cliente>(`${this.baseURL}/${id}/activate`);
    return response.data;
  }

  /**
   * Get contacts for a client
   */
  async getContatos(clienteId: string): Promise<ClienteContato[]> {
    const response = await api.get<ClienteContato[]>(
      `${this.baseURL}/${clienteId}/contatos`
    );
    return response.data;
  }

  /**
   * Add a contact to a client
   */
  async addContato(
    clienteId: string,
    contato: Omit<ClienteContato, "id">
  ): Promise<ClienteContato> {
    const response = await api.post<ClienteContato>(
      `${this.baseURL}/${clienteId}/contatos`,
      contato
    );
    return response.data;
  }

  /**
   * Delete a contact
   */
  async deleteContato(contatoId: string): Promise<void> {
    await api.delete(`${this.baseURL}/contatos/${contatoId}`);
  }

  /**
   * Upload client logo
   */
  async uploadLogo(
    clienteId: string,
    file: File
  ): Promise<{ message: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await api.post<{ message: string }>(
      `${this.baseURL}/${clienteId}/logo`,
      formData
    );
    return response.data;
  }

  /**
   * Get client logo
   */
  async getLogo(clienteId: string): Promise<{
    nomeArquivo: string;
    tipoMime: string;
    tamanho: number;
    base64: string;
  }> {
    const response = await api.get(`${this.baseURL}/${clienteId}/logo`);
    return response.data;
  }

  /**
   * Delete client logo
   */
  async deleteLogo(clienteId: string): Promise<void> {
    await api.delete(`${this.baseURL}/${clienteId}/logo`);
  }

  /**
   * Check if client has logo
   */
  async hasLogo(clienteId: string): Promise<boolean> {
    const response = await api.get<boolean | { hasLogo: boolean }>(
      `${this.baseURL}/${clienteId}/logo/exists`
    );
    if (typeof response.data === "object") {
      return response.data.hasLogo;
    }
    return response.data;
  }

  /**
   * Set a contact as principal
   */
  async setContatoPrincipal(contatoId: string): Promise<ClienteContato> {
    const response = await api.patch<ClienteContato>(
      `${this.baseURL}/contatos/${contatoId}/principal`
    );
    return response.data;
  }
}

export default new ClienteService();
