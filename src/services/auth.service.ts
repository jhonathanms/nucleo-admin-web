import api from "./api";
import { TokenStorage } from "@/lib/token-storage";
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
    const response = await api.post<LoginResponse>("/auth/login", data);

    // Save tokens and user data
    TokenStorage.setAccessToken(response.data.accessToken);
    TokenStorage.setRefreshToken(response.data.refreshToken);
    TokenStorage.setUser(response.data.user);

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
      data
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
   * Get stored user data
   */
  getStoredUser(): User | null {
    return TokenStorage.getUser();
  }
}

export default new AuthService();
