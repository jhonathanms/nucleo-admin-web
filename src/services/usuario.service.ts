import api from "./api";
import { QueryParams } from "@/types/common.types";
import {
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
  UsuarioVinculoDTO,
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
   * Reset usuario password (admin action)
   */
  async resetPassword(id: string, data: ResetPasswordDTO): Promise<void> {
    await api.post(`${this.baseURL}/${id}/reset-password`, data);
  }

  /**
   * Change own password
   */
  async changePassword(id: string, data: any): Promise<void> {
    await api.post(`${this.baseURL}/${id}/change-password`, data);
  }

  /**
   * Logout user from all linked products
   */
  async logoutFromAll(id: string): Promise<void> {
    await api.post(`/auth/revogar-sessoes/${id}`);
  }

  /**
   * Get usuarios by cliente ID
   */
  async getByCliente(
    clienteId: string,
    params?: QueryParams
  ): Promise<UsuarioListResponse> {
    const response = await api.get<UsuarioListResponse>(
      `${this.baseURL}/cliente/${clienteId}`,
      {
        params,
      }
    );
    return response.data;
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

  /**
   * Get usuarios by type (INTERNO or CLIENTE)
   */
  async getByTipo(
    tipo: "INTERNO" | "CLIENTE",
    params?: QueryParams
  ): Promise<UsuarioListResponse> {
    const response = await api.get<UsuarioListResponse>(
      `${this.baseURL}/tipo/${tipo}`,
      {
        params,
      }
    );
    return response.data;
  }

  /**
   * Add link to user (company/license)
   */
  async addVinculo(id: string, data: UsuarioVinculoDTO): Promise<Usuario> {
    const response = await api.post<Usuario>(
      `${this.baseURL}/${id}/vinculos`,
      data
    );
    return response.data;
  }

  /**
   * Remove link from user
   */
  async removeVinculo(id: string, vinculoId: string): Promise<Usuario> {
    const response = await api.delete<Usuario>(
      `${this.baseURL}/${id}/vinculos/${vinculoId}`
    );
    return response.data;
  }

  /**
   * Upload user avatar
   */
  async uploadAvatar(id: string, file: File): Promise<void> {
    const formData = new FormData();
    formData.append("file", file);
    await api.post(`${this.baseURL}/${id}/avatar`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
  }

  /**
   * Check if user has avatar
   */
  async checkAvatarExists(id: string): Promise<boolean> {
    if (!id) return false;
    const response = await api.get<{ hasAvatar: boolean }>(
      `${this.baseURL}/${id}/avatar/exists`
    );
    return response.data.hasAvatar;
  }

  /**
   * Get user avatar (base64)
   */
  async getAvatar(id: string): Promise<{
    nomeArquivo: string;
    tipoMime: string;
    tamanho: number;
    base64: string;
  }> {
    const response = await api.get(`${this.baseURL}/${id}/avatar`);
    return response.data;
  }

  /**
   * Delete user avatar
   */
  async deleteAvatar(id: string): Promise<void> {
    await api.delete(`${this.baseURL}/${id}/avatar`);
  }

  /**
   * Update user status (active/inactive)
   */
  async updateStatus(id: string, ativo: boolean): Promise<Usuario> {
    const response = await api.patch<Usuario>(
      `${this.baseURL}/${id}/status`,
      null,
      {
        params: { ativo },
      }
    );
    return response.data;
  }
}

export default new UsuarioService();
