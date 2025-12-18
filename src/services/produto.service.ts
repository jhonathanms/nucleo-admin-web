import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Produto,
  CreateProdutoDTO,
  UpdateProdutoDTO,
  ProdutoListResponse,
  ProdutoTipo,
} from "@/types/produto.types";

class ProdutoService {
  private readonly baseURL = "/produtos";

  /**
   * Get all produtos with pagination
   */
  async getAll(params?: QueryParams): Promise<ProdutoListResponse> {
    const response = await api.get<ProdutoListResponse>(this.baseURL, {
      params,
    });
    return response.data;
  }

  /**
   * Get produto by ID
   */
  async getById(id: string): Promise<Produto> {
    const response = await api.get<Produto>(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new produto
   */
  async create(data: CreateProdutoDTO): Promise<Produto> {
    const response = await api.post<Produto>(this.baseURL, data);
    return response.data;
  }

  /**
   * Update produto
   */
  async update(id: string, data: UpdateProdutoDTO): Promise<Produto> {
    const response = await api.put<Produto>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete produto
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Get produtos by tipo
   */
  async getByTipo(
    tipo: ProdutoTipo,
    params?: QueryParams
  ): Promise<ProdutoListResponse> {
    const response = await api.get<ProdutoListResponse>(
      `${this.baseURL}/tipo/${tipo}`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Get only active produtos
   */
  async getAtivos(params?: QueryParams): Promise<ProdutoListResponse> {
    const response = await api.get<ProdutoListResponse>(
      `${this.baseURL}/ativos`,
      {
        params,
      }
    );
    return response.data;
  }
}

export default new ProdutoService();
