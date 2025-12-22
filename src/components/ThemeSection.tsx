import { useTheme } from "@/components/ThemeProvider";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Monitor, Sun, Moon } from "lucide-react";

export function ThemeSection() {
  const { theme, setTheme } = useTheme();

  const themeOptions = [
    {
      value: "light" as const,
      label: "Claro",
      description: "Tema com fundo claro",
      icon: Sun,
    },
    {
      value: "dark" as const,
      label: "Escuro",
      description: "Tema com fundo escuro",
      icon: Moon,
    },
    {
      value: "system" as const,
      label: "Sistema",
      description: "Seguir preferência do sistema",
      icon: Monitor,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tema da Interface</CardTitle>
        <CardDescription>
          Personalize a aparência do sistema escolhendo entre os temas
          disponíveis.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {themeOptions.map((option) => {
            const Icon = option.icon;
            const isActive = theme === option.value;

            return (
              <button
                key={option.value}
                onClick={() => setTheme(option.value)}
                className={`relative flex flex-col items-center p-6 rounded-lg border-2 transition-all hover:scale-105 ${
                  isActive
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div
                  className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 ${
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <Icon className="h-8 w-8" />
                </div>
                <h3 className="font-semibold text-base mb-1">{option.label}</h3>
                <p className="text-xs text-muted-foreground text-center">
                  {option.description}
                </p>
                {isActive && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-primary-foreground"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
