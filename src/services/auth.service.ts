import api from "./api";
import { TokenStorage } from "@/lib/token-storage";
import { AppError } from "@/types/common.types";
import {
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  User,
  UpdateProfileRequest,
  ChangePasswordRequest,
} from "@/types/auth.types";

class AuthService {
  /**
   * Login user with email and password
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    // Use skipAuthRedirect to prevent interceptor from redirecting on login failure
    const response = await api.post<LoginResponse>("/auth/login", data, {
      headers: { skipAuthRedirect: "true" },
    });

    // Check if user has permission to access the admin panel
    // Only internal users (ADMIN, GERENTE, OPERADOR) can access

    if (response.data.user.role === "CLIENTE") {
      throw new AppError(
        [
          {
            codigo: -9,
            mensagem:
              "Acesso negado. Usuário não possui permissão para acessar este sistema.",
            metadata: null,
          },
        ],
        403,
      );
    }

    // Save tokens and user data
    TokenStorage.setAccessToken(response.data.accessToken);
    TokenStorage.setRefreshToken(response.data.refreshToken);
    TokenStorage.setUser(response.data.user);

    // Update theme if user has preference
    if (response.data.user.tema) {
      localStorage.setItem("nucleo-admin-theme", response.data.user.tema);
    }

    return response.data;
  }

  /**
   * Logout current user
   */
  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout");
    } finally {
      // Always clear tokens, even if request fails
      TokenStorage.clear();
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(): Promise<RefreshTokenResponse> {
    const refreshToken = TokenStorage.getRefreshToken();

    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    const data: RefreshTokenRequest = { refreshToken };
    const response = await api.post<RefreshTokenResponse>(
      "/auth/refresh",
      data,
    );

    // Update tokens
    TokenStorage.setAccessToken(response.data.accessToken);
    if (response.data.refreshToken) {
      TokenStorage.setRefreshToken(response.data.refreshToken);
    }

    return response.data;
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<User>("/auth/me");

    // Update user data in storage
    TokenStorage.setUser(response.data);

    return response.data;
  }

  /**
   * Update user profile
   */
  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await api.put<User>("/auth/profile", data);

    // Update user data in storage
    TokenStorage.setUser(response.data);

    return response.data;
  }

  /**
   * Update user theme preference
   */
  async updateTheme(theme: "light" | "dark" | "system"): Promise<void> {
    await api.put("/auth/theme", { theme });
  }

  /**
   * Change user password
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    await api.post("/auth/change-password", data);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return TokenStorage.isAuthenticated();
  }

  /**
   * Request password reset email
   */
  async forgotPassword(email: string): Promise<void> {
    await api.post(
      "/auth/esqueci-senha",
      { email },
      {
        headers: { skipAuthRedirect: "true" },
      },
    );
  }

  /**
   * Validate password reset token
   */
  async validateResetToken(
    token: string,
  ): Promise<{ valido: boolean; email?: string }> {
    const response = await api.post<{ valido: boolean; email?: string }>(
      "/auth/validar-token-redefinicao",
      { token },
      { headers: { skipAuthRedirect: "true" } },
    );
    return response.data;
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    await api.post(
      "/auth/redefinir-senha",
      { token, novaSenha: newPassword },
      {
        headers: { skipAuthRedirect: "true" },
      },
    );
  }

  /**
   * Get stored user data
   */
  getStoredUser(): User | null {
    return TokenStorage.getUser();
  }
}

export default new AuthService();
