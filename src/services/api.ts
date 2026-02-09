import axios, { AxiosInstance } from "axios";
import {
  requestInterceptor,
  errorRequestInterceptor,
} from "./interceptors/request.interceptor";
import {
  createResponseErrorInterceptor,
  responseSuccessInterceptor,
} from "./interceptors/response.interceptor";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8680/api";
const API_TIMEOUT = parseInt(import.meta.env.VITE_API_TIMEOUT || "30000");
const TAG_PRODUTO = import.meta.env.VITE_TAG_PRODUTO || "APP_NUCLEO_ADMIN";

/**
 * Cria a instância do axios com configuração padrão
 */
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
});

/**
 * Configura os interceptors de request
 */
api.interceptors.request.use(
  requestInterceptor(TAG_PRODUTO),
  errorRequestInterceptor,
);

/**
 * Configura os interceptors de response
 */
api.interceptors.response.use(
  responseSuccessInterceptor,
  createResponseErrorInterceptor(api, API_BASE_URL),
);

export default api;
