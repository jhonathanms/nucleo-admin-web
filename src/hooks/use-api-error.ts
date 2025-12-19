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

      toast({
        title: "Erro",
        description: backendError?.message || defaultMessage,
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
