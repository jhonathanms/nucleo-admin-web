import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Plano,
  CreatePlanoDTO,
  UpdatePlanoDTO,
  PlanoListResponse,
} from "@/types/plano.types";

class PlanoService {
  private readonly baseURL = "/planos";

  /**
   * Get all planos with pagination
   */
  async getAll(params?: QueryParams): Promise<PlanoListResponse> {
    const response = await api.get<PlanoListResponse>(this.baseURL, { params });
    return response.data;
  }

  /**
   * Get plano by ID
   */
  async getById(id: string): Promise<Plano> {
    const response = await api.get<Plano>(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new plano
   */
  async create(data: CreatePlanoDTO): Promise<Plano> {
    const response = await api.post<Plano>(this.baseURL, data);
    return response.data;
  }

  /**
   * Update plano
   */
  async update(id: string, data: UpdatePlanoDTO): Promise<Plano> {
    const response = await api.put<Plano>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete plano
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Get planos by produto
   */
  async getByProduto(
    produtoId: string,
    params?: QueryParams
  ): Promise<PlanoListResponse> {
    const response = await api.get<PlanoListResponse>(
      `${this.baseURL}/produto/${produtoId}`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Duplicate plano
   */
  async duplicate(id: string): Promise<Plano> {
    const response = await api.post<Plano>(`${this.baseURL}/${id}/duplicate`);
    return response.data;
  }
}

export default new PlanoService();
