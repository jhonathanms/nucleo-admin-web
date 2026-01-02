import { useState, useCallback } from "react";
import { ApiError } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useApiError() {
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const { toast } = useToast();

  const handleError = useCallback(
    (error: any, defaultMessage: string) => {
      console.error(defaultMessage, error);
      const backendError = error.response?.data as ApiError;
      setApiError(backendError);

      const translateMessage = (msg: string) => {
        const translations: Record<string, string> = {
          "Validation failed": "Falha na validação dos dados",
          "Access denied": "Acesso negado",
          "Internal server error": "Erro interno do servidor",
          "Resource not found": "Recurso não encontrado",
          "Invalid credentials": "Credenciais inválidas",
          "User already exists": "Usuário já cadastrado",
          "Email already in use": "E-mail já está em uso",
        };
        return translations[msg] || msg;
      };

      let description = translateMessage(
        backendError?.message || defaultMessage
      );

      // Se houver erros de validação específicos, adiciona-os à descrição
      if (backendError?.errors && Object.keys(backendError.errors).length > 0) {
        const validationMessages = Object.entries(backendError.errors)
          .map(([field, messages]) => `${field}: ${messages.join(", ")}`)
          .join("\n");
        description = `${description}\n${validationMessages}`;
      }

      const getTitle = (status: number) => {
        if (status >= 500) return "Erro de Servidor";
        switch (status) {
          case 400:
          case 422:
            return "Erro de Validação";
          case 401:
            return "Sessão Expirada";
          case 403:
            return "Acesso Negado";
          case 404:
            return "Não Encontrado";
          default:
            return "Erro na Requisição";
        }
      };

      toast({
        title: getTitle(backendError?.status || 0),
        description: description,
        variant: "destructive",
      });
    },
    [toast]
  );

  const clearError = useCallback(() => {
    setApiError(null);
  }, []);

  return { apiError, handleError, clearError, setApiError };
}
