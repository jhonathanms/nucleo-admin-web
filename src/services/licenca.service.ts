import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Licenca,
  CreateLicencaDTO,
  UpdateLicencaDTO,
  RenovarLicencaDTO,
  LicencaListResponse,
} from "@/types/licenca.types";

class LicencaService {
  private readonly baseURL = "/licencas";

  /**
   * Get all licencas with pagination
   */
  async getAll(params?: QueryParams): Promise<LicencaListResponse> {
    const response = await api.get<LicencaListResponse>(this.baseURL, {
      params,
    });
    return response.data;
  }

  /**
   * Get licenca by ID
   */
  async getById(id: string): Promise<Licenca> {
    const response = await api.get<Licenca>(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new licenca
   */
  async create(data: CreateLicencaDTO): Promise<Licenca> {
    const response = await api.post<Licenca>(this.baseURL, data);
    return response.data;
  }

  /**
   * Update licenca
   */
  async update(id: string, data: UpdateLicencaDTO): Promise<Licenca> {
    const response = await api.put<Licenca>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete licenca
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Get licencas by cliente
   */
  async getByCliente(
    clienteId: string,
    params?: QueryParams
  ): Promise<LicencaListResponse> {
    const response = await api.get<LicencaListResponse>(
      `${this.baseURL}/cliente/${clienteId}`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Renovar licenca
   */
  async renovar(id: string, data: RenovarLicencaDTO): Promise<Licenca> {
    const response = await api.post<Licenca>(
      `${this.baseURL}/${id}/renovar`,
      data
    );
    return response.data;
  }

  /**
   * Suspender licenca
   */
  async suspender(id: string): Promise<Licenca> {
    const response = await api.patch<Licenca>(
      `${this.baseURL}/${id}/suspender`
    );
    return response.data;
  }

  /**
   * Ativar licenca
   */
  async ativar(id: string): Promise<Licenca> {
    const response = await api.patch<Licenca>(`${this.baseURL}/${id}/ativar`);
    return response.data;
  }

  /**
   * Gerar nova chave de licenca
   */
  async gerarChave(): Promise<{ chave: string }> {
    const response = await api.get<{ chave: string }>(
      `${this.baseURL}/gerar-chave`
    );
    return response.data;
  }
}

export default new LicencaService();
