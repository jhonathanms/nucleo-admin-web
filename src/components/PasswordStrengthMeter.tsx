import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface PasswordRequirement {
  label: string;
  met: boolean;
}

interface PasswordStrengthMeterProps {
  password: string;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  className,
}: PasswordStrengthMeterProps) {
  const requirements: PasswordRequirement[] = [
    {
      label: "Mínimo de 8 caracteres",
      met: password.length >= 8,
    },
    {
      label: "Pelo menos uma letra maiúscula",
      met: /[A-Z]/.test(password),
    },
    {
      label: "Pelo menos uma letra minúscula",
      met: /[a-z]/.test(password),
    },
    {
      label: "Pelo menos um número",
      met: /\d/.test(password),
    },
    {
      label: "Pelo menos um caractere especial (@#$%^&+=!*()_-)",
      met: /[@#$%^&+=!*()_-]/.test(password),
    },
  ];

  const metCount = requirements.filter((req) => req.met).length;
  const strength =
    metCount === 0
      ? "none"
      : metCount <= 2
      ? "weak"
      : metCount <= 3
      ? "medium"
      : metCount <= 4
      ? "good"
      : "strong";

  const strengthConfig = {
    none: { label: "", color: "bg-gray-200", width: "0%" },
    weak: { label: "Fraca", color: "bg-red-500", width: "20%" },
    medium: { label: "Média", color: "bg-orange-500", width: "50%" },
    good: { label: "Boa", color: "bg-yellow-500", width: "75%" },
    strong: { label: "Forte", color: "bg-green-500", width: "100%" },
  };

  const config = strengthConfig[strength];

  return (
    <div className={cn("space-y-3", className)}>
      {password && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">Força da senha:</span>
            <span
              className={cn(
                "font-semibold",
                strength === "weak" && "text-red-500",
                strength === "medium" && "text-orange-500",
                strength === "good" && "text-yellow-500",
                strength === "strong" && "text-green-500"
              )}
            >
              {config.label}
            </span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div
              className={cn("h-full transition-all duration-300", config.color)}
              style={{ width: config.width }}
            />
          </div>
        </div>
      )}

      <ul className="space-y-1.5">
        {requirements.map((req, index) => (
          <li key={index} className="flex items-center gap-2 text-xs">
            {req.met ? (
              <Check className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            ) : (
              <X className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
            )}
            <span
              className={cn(
                "transition-colors",
                req.met ? "text-green-600 font-medium" : "text-muted-foreground"
              )}
            >
              {req.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
