import api from "./api";
import {
  TituloFinanceiro,
  CreateTituloDTO,
  UpdateTituloDTO,
  TituloListResponse,
} from "@/types/financeiro.types";

class FinanceiroService {
  async getAll(params?: any): Promise<TituloListResponse> {
    const response = await api.get<TituloListResponse>("/financeiro/titulos", {
      params,
    });
    return response.data;
  }

  async getById(id: string): Promise<TituloFinanceiro> {
    const response = await api.get<TituloFinanceiro>(
      `/financeiro/titulos/${id}`
    );
    return response.data;
  }

  async create(data: CreateTituloDTO): Promise<TituloFinanceiro> {
    const response = await api.post<TituloFinanceiro>(
      "/financeiro/titulos",
      data
    );
    return response.data;
  }

  async update(id: string, data: UpdateTituloDTO): Promise<TituloFinanceiro> {
    const response = await api.put<TituloFinanceiro>(
      `/financeiro/titulos/${id}`,
      data
    );
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/financeiro/titulos/${id}`);
  }

  async registrarPagamento(id: string): Promise<TituloFinanceiro> {
    const response = await api.post<TituloFinanceiro>(
      `/financeiro/titulos/${id}/pagamento`
    );
    return response.data;
  }

  async cancelar(id: string): Promise<TituloFinanceiro> {
    const response = await api.post<TituloFinanceiro>(
      `/financeiro/titulos/${id}/cancelar`
    );
    return response.data;
  }
}

export default new FinanceiroService();
