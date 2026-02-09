import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from "axios";
import { TokenStorage } from "@/lib/token-storage";
import { AppError, ErroDTO, ApiErrorCodes } from "@/types/common.types";

// Flag para evitar múltiplas requisições simultâneas de refresh token
let isRefreshing = false;
let isRedirecting = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

/**
 * Processa a fila de requisições que estavam aguardando o refresh token.
 */
const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

/**
 * Realiza o logout e redireciona. Dispara evento global se não for silencioso.
 */
const handleLogoutAndRedirect = async (
  mensagem?: string,
  silent: boolean = false,
) => {
  if (isRedirecting) return;
  isRedirecting = true;

  if (!silent) {
    window.dispatchEvent(
      new CustomEvent("nucleo_admin_logout_event", {
        detail: {
          message:
            mensagem || "Sessão expirada. Redirecionando para o login...",
        },
      }),
    );
    await new Promise((resolve) => setTimeout(resolve, 3000));
  }

  try {
    TokenStorage.clear();
    // Chaves específicas do projeto que precisam ser limpas
    // Atualmente TokenStorage.clear() já remove tokens e dados do usuário
    // Mantemos propositalmente nucleo-admin-theme e nucleo-admin-remember-email
  } catch (error) {
    console.error("Erro ao limpar cache local:", error);
  }

  window.location.href = "/login";
};

/**
 * Cria o interceptor de resposta para lidar com erros, refresh token e logout.
 */
export const createResponseErrorInterceptor =
  (api: AxiosInstance, baseURL: string) => async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Pula o redirecionamento de autenticação se a flag estiver setada (ex: durante tentativas de login)
    const skipAuthRedirect = originalRequest.headers?.skipAuthRedirect;

    // Recupera o token atual do storage e o token enviado na requisição
    const currentToken = TokenStorage.getAccessToken();
    const requestToken =
      originalRequest.headers?.Authorization?.toString().split(" ")[1];

    // Verificar se o token da requisição é diferente do token guardado.
    // Isso acontece se outra requisição já atualizou o token enquanto esta estava em voo (concorrência).
    // Se o token já mudou, tentamos novamente com o novo token imediatamente, evitando logout falso.
    if (currentToken && requestToken && currentToken !== requestToken) {
      originalRequest.headers.Authorization = `Bearer ${currentToken}`;
      return api(originalRequest);
    }

    let errorData: ErroDTO[] = [];

    if (error.response?.data) {
      if (Array.isArray(error.response.data)) {
        errorData = error.response.data as ErroDTO[];
      } else if (
        typeof error.response.data === "object" &&
        "codigo" in (error.response.data as any)
      ) {
        errorData = [error.response.data as ErroDTO];
      } else {
        // Fallback para erros não padronizados
        errorData = [
          {
            codigo: -999,
            mensagem:
              (error.response.data as any).message || "Erro desconhecido",
            metadata: null,
          },
        ];
      }
    } else {
      errorData = [
        {
          codigo: -999,
          mensagem: error.message || "Erro de conexão",
          metadata: null,
        },
      ];
    }

    const appError = new AppError(errorData, error.response?.status || 500);

    if (isRedirecting) return Promise.reject(error);

    const isLoginPage = window.location.pathname === "/login";
    if (isLoginPage) return Promise.reject(appError);

    const isAuthPath =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/logout");
    if (isAuthPath) return Promise.reject(appError);

    // Se houver um refresh em andamento, todas as requisições 401 devem esperar,
    // independentemente do código de erro (pois pode ser um falso negativo de sessão expirada).
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        })
        .catch((err) => {
          return Promise.reject(err);
        });
    }

    // Verifica erro de Token Expirado (código -2)
    const isTokenExpired = errorData.some(
      (e) => e.codigo === ApiErrorCodes.TOKEN_EXPIRADO,
    );

    // Se erro 401, token expirado e ainda não tentamos novamente
    if (
      error.response?.status === 401 &&
      isTokenExpired &&
      !originalRequest._retry &&
      !skipAuthRedirect
    ) {
      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenStorage.getRefreshToken();

      if (!refreshToken) {
        // Sem refresh token disponível, logout silencioso
        isRefreshing = false;
        handleLogoutAndRedirect(undefined, true);
        return Promise.reject(appError);
      }

      try {
        // Chama endpoint de refresh token
        // Usamos uma execução única aqui (túnel) garantida pela flag isRefreshing
        const response = await axios.post(`${baseURL}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Atualiza tokens no storage
        TokenStorage.setAccessToken(accessToken);
        if (newRefreshToken) {
          TokenStorage.setRefreshToken(newRefreshToken);
        }

        // Atualiza header de autorização da requisição original
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }

        // Processa requisições na fila com o novo token
        processQueue(null, accessToken);

        // Tenta novamente a requisição original
        return api(originalRequest);
      } catch (refreshError) {
        // Falha no refresh token, processa fila com erro
        processQueue(refreshError as Error, null);
        // handleLogoutAndRedirect(undefined, true);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Adapta regras de logout do ErrorInterceptor.ts
    const codigoErro = errorData[0]?.codigo;
    const codigosLogout = [
      ApiErrorCodes.SESSAO_INVALIDA,
      ApiErrorCodes.SESSAO_EXPIRADA,
      ApiErrorCodes.SEM_LICENCA_USUARIO,
      ApiErrorCodes.USUARIO_INATIVO_LICENCA,
      ApiErrorCodes.TOKEN_INVALIDO,
      ApiErrorCodes.TOKEN_REVOGADO,
      ApiErrorCodes.LICENCA_NAO_ENCONTRADA,
    ];

    if (codigoErro && codigosLogout.includes(codigoErro) && !skipAuthRedirect) {
      const msg = [
        ApiErrorCodes.SESSAO_INVALIDA,
        ApiErrorCodes.SESSAO_EXPIRADA,
      ].includes(codigoErro)
        ? "Sua sessão foi encerrada pelo administrador. Saindo da plataforma...."
        : undefined;

      const silent =
        codigoErro === ApiErrorCodes.TOKEN_INVALIDO ||
        codigoErro === ApiErrorCodes.TOKEN_EXPIRADO;

      handleLogoutAndRedirect(msg, silent);
      return new Promise(() => {});
    }

    // Fallback geral para 401
    // if (error.response?.status === 401 && !skipAuthRedirect) {
    //   handleLogoutAndRedirect(undefined, true);
    //   return new Promise(() => {});
    // }

    return Promise.reject(appError);
  };

export const responseSuccessInterceptor = (response: any) => {
  return response;
};
