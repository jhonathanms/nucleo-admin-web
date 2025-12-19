import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ApiError } from "@/types/common.types";
import {
  AlertCircle,
  AlertTriangle,
  Lock,
  SearchX,
  ServerCrash,
  XCircle,
  ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ApiErrorAlertProps {
  error: ApiError | null | undefined;
  className?: string;
}

export function ApiErrorAlert({ error, className }: ApiErrorAlertProps) {
  if (!error) return null;

  const getStatusConfig = (status: number) => {
    if (status >= 500) {
      return {
        icon: ServerCrash,
        color: "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
        title: "Erro de Servidor",
      };
    }

    switch (status) {
      case 400:
      case 422:
        return {
          icon: AlertCircle,
          color:
            "border-orange-500/50 bg-orange-500/10 text-orange-600 dark:text-orange-400",
          title: "Erro de Validação",
        };
      case 401:
        return {
          icon: Lock,
          color:
            "border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400",
          title: "Sessão Expirada",
        };
      case 403:
        return {
          icon: ShieldAlert,
          color:
            "border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400",
          title: "Acesso Negado",
        };
      case 404:
        return {
          icon: SearchX,
          color:
            "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400",
          title: "Não Encontrado",
        };
      default:
        return {
          icon: AlertTriangle,
          color: "border-destructive/50 bg-destructive/10 text-destructive",
          title: "Erro na Requisição",
        };
    }
  };

  const config = getStatusConfig(error.status);
  const Icon = config.icon;

  return (
    <Alert
      className={cn(
        "animate-in fade-in slide-in-from-top-2 duration-300",
        config.color,
        className
      )}
    >
      <Icon className="h-4 w-4" />
      <AlertTitle className="font-bold flex items-center gap-2">
        {config.title}
      </AlertTitle>
      <AlertDescription className="space-y-2">
        <p className="text-sm font-medium">{error.message}</p>

        {error.errors && Object.keys(error.errors).length > 0 && (
          <div className="mt-2 rounded-md bg-background/50 p-2 border border-current/10">
            <ul className="list-disc list-inside space-y-1">
              {Object.entries(error.errors).map(([field, messages]) => (
                <li key={field} className="text-xs">
                  <span className="font-semibold capitalize">{field}:</span>{" "}
                  {messages.join(", ")}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex items-center justify-between pt-1 text-[10px] opacity-70 font-mono">
          <span className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Status: {error.status}
          </span>
          <span>{new Date(error.timestamp).toLocaleString()}</span>
        </div>
      </AlertDescription>
    </Alert>
  );
}
