import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Recurso,
  CreateRecursoDTO,
  UpdateRecursoDTO,
  RecursoListResponse,
} from "@/types/recurso.types";

class RecursoService {
  private readonly baseURL = "/recursos";

  async getAll(params?: QueryParams): Promise<RecursoListResponse> {
    const response = await api.get<RecursoListResponse>(this.baseURL, {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<Recurso> {
    const response = await api.get<Recurso>(`${this.baseURL}/${id}`);
    return response.data;
  }

  async create(data: CreateRecursoDTO): Promise<Recurso> {
    const response = await api.post<Recurso>(this.baseURL, data);
    return response.data;
  }

  async update(id: string, data: UpdateRecursoDTO): Promise<Recurso> {
    const response = await api.put<Recurso>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }
}

export default new RecursoService();
