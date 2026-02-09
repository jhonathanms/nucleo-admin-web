import { InternalAxiosRequestConfig, AxiosError } from "axios";
import { TokenStorage } from "@/lib/token-storage";

export const requestInterceptor =
  (tagProduto: string) => (config: InternalAxiosRequestConfig) => {
    const token = TokenStorage.getAccessToken();

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Sempre adiciona o header da tag de produto
    if (config.headers) {
      config.headers["X-TAG_PRODUTO"] = tagProduto;
    }

    return config;
  };

export const errorRequestInterceptor = (error: AxiosError) => {
  return Promise.reject(error);
};
