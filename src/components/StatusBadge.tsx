import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "success" | "warning" | "destructive" | "info" | "muted";
  icon?: LucideIcon;
  className?: string;
}

const variantStyles = {
  default: "bg-primary/10 text-primary border-primary/20",
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  destructive: "bg-destructive/10 text-destructive border-destructive/20",
  info: "bg-info/10 text-info border-info/20",
  muted: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ status, variant = "default", icon: Icon, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full border",
        variantStyles[variant],
        className
      )}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {status}
    </span>
  );
}

// Mapeamento de status para variantes
export const statusVariantMap: Record<string, "success" | "warning" | "destructive" | "info" | "muted"> = {
  ATIVO: "success",
  PAGO: "success",
  APROVADO: "success",
  INADIMPLENTE: "warning",
  PENDENTE: "warning",
  EM_ATRASO: "warning",
  SUSPENSO: "destructive",
  CANCELADO: "destructive",
  INATIVO: "muted",
  TRIAL: "info",
};

export function getStatusVariant(status: string) {
  return statusVariantMap[status] || "default";
}
