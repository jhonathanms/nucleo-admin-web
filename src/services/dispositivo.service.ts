import api from "./api";
import {
  Dispositivo,
  RegistrarDispositivoRequest,
  ValidacaoDispositivoResponse,
  UpdateDispositivoRequest,
} from "@/types/dispositivo.types";
import { PaginatedResponse, QueryParams } from "@/types/common.types";

class DispositivoService {
  private readonly baseURL = "/dispositivos";

  /**
   * Listar todos os dispositivos com paginação e filtros
   */
  async getAll(params?: QueryParams): Promise<PaginatedResponse<Dispositivo>> {
    const response = await api.get<PaginatedResponse<Dispositivo>>(
      this.baseURL,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Buscar dispositivos de uma licença específica
   */
  async getByLicenca(
    licencaId: string,
    params?: QueryParams
  ): Promise<PaginatedResponse<Dispositivo>> {
    const response = await api.get<PaginatedResponse<Dispositivo>>(
      `${this.baseURL}/licenca/${licencaId}`,
      { params }
    );
    return response.data;
  }

  /**
   * Registrar um novo dispositivo
   */
  async registrar(
    data: RegistrarDispositivoRequest
  ): Promise<ValidacaoDispositivoResponse> {
    const response = await api.post<ValidacaoDispositivoResponse>(
      `${this.baseURL}/registrar`,
      data
    );
    return response.data;
  }

  /**
   * Validar um dispositivo existente
   */
  async validar(
    deviceId: string,
    licencaChave: string
  ): Promise<ValidacaoDispositivoResponse> {
    const response = await api.get<ValidacaoDispositivoResponse>(
      `${this.baseURL}/validar`,
      {
        params: { deviceId, licencaChave },
      }
    );
    return response.data;
  }

  /**
   * Atualizar dados de um dispositivo (apelido, tipo, status)
   */
  async update(
    id: string,
    data: UpdateDispositivoRequest
  ): Promise<Dispositivo> {
    const response = await api.put<Dispositivo>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Bloquear um dispositivo
   */
  async bloquear(id: string): Promise<Dispositivo> {
    const response = await api.post<Dispositivo>(
      `${this.baseURL}/${id}/bloquear`
    );
    return response.data;
  }

  /**
   * Desbloquear um dispositivo
   */
  async desbloquear(id: string): Promise<Dispositivo> {
    const response = await api.post<Dispositivo>(
      `${this.baseURL}/${id}/desbloquear`
    );
    return response.data;
  }

  /**
   * Remover um dispositivo
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }
}

export default new DispositivoService();
