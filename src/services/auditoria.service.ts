import api from "./api";
import { LogListResponse } from "@/types/auditoria.types";

class AuditoriaService {
  async getAll(params?: any): Promise<LogListResponse> {
    const response = await api.get<LogListResponse>("/auditoria", {
      params,
    });
    return response.data;
  }
}

export default new AuditoriaService();
