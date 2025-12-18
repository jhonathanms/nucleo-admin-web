import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
  ClienteListResponse,
} from "@/types/cliente.types";

class ClienteService {
  private readonly baseURL = "/clientes";

  /**
   * Get all clientes with pagination
   */
  async getAll(params?: QueryParams): Promise<ClienteListResponse> {
    const response = await api.get<ClienteListResponse>(this.baseURL, {
      params,
    });
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
    const response = await api.get<ClienteListResponse>(
      `${this.baseURL}/search`,
      {
        params: { ...params, q: query },
      }
    );
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
}

export default new ClienteService();
