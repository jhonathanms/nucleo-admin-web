import { useState, useCallback } from "react";
import { AppError, ErroDTO } from "@/types";
import { useToast } from "@/hooks/use-toast";

export function useApiError() {
  const [apiError, setApiError] = useState<AppError | null>(null);
  const { toast } = useToast();

  const handleError = useCallback(
    (error: any, defaultMessage: string) => {
      console.error(defaultMessage, error);

      let description = defaultMessage;
      let status = 0;

      if (error instanceof AppError) {
        setApiError(error);
        status = error.status;

        if (error.errors && error.errors.length > 0) {
          description = error.errors
            .map((e) => {
              if (e.metadata && typeof e.metadata === "string") {
                return `${e.metadata}: ${e.mensagem}`;
              }
              return e.mensagem;
            })
            .join("\n");
        }
      } else {
        // Fallback for unknown errors
        setApiError(null); // Or create a generic AppError
        if (error?.message) {
          description = error.message;
        }
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
        title: getTitle(status),
        description: description,
        variant: "destructive",
      });
    },
    [toast],
  );

  const clearError = useCallback(() => {
    setApiError(null);
  }, []);

  return { apiError, handleError, clearError, setApiError };
}
