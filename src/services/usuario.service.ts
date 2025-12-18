import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  ResetPasswordDTO,
  UsuarioListResponse,
} from "@/types/usuario.types";
import { UserRole } from "@/types/auth.types";

class UsuarioService {
  private readonly baseURL = "/usuarios";

  /**
   * Get all usuarios with pagination
   */
  async getAll(params?: QueryParams): Promise<UsuarioListResponse> {
    const response = await api.get<UsuarioListResponse>(this.baseURL, {
      params,
    });
    return response.data;
  }

  /**
   * Get usuario by ID
   */
  async getById(id: string): Promise<Usuario> {
    const response = await api.get<Usuario>(`${this.baseURL}/${id}`);
    return response.data;
  }

  /**
   * Create new usuario
   */
  async create(data: CreateUsuarioDTO): Promise<Usuario> {
    const response = await api.post<Usuario>(this.baseURL, data);
    return response.data;
  }

  /**
   * Update usuario
   */
  async update(id: string, data: UpdateUsuarioDTO): Promise<Usuario> {
    const response = await api.put<Usuario>(`${this.baseURL}/${id}`, data);
    return response.data;
  }

  /**
   * Delete usuario
   */
  async delete(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}`);
  }

  /**
   * Reset usuario password
   */
  async resetPassword(id: string, data: ResetPasswordDTO): Promise<void> {
    await api.post(`${this.baseURL}/${id}/reset-password`, data);
  }

  /**
   * Get usuarios by role
   */
  async getByRole(
    role: UserRole,
    params?: QueryParams
  ): Promise<UsuarioListResponse> {
    const response = await api.get<UsuarioListResponse>(
      `${this.baseURL}/role/${role}`,
      {
        params,
      }
    );
    return response.data;
  }
}

export default new UsuarioService();
