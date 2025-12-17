import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simular login
    setTimeout(() => {
      setIsLoading(false);
      navigate("/dashboard");
    }, 1000);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center rounded-xl bg-primary p-3 mb-4">
              <Package className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">SaaS Admin</h1>
            <p className="text-muted-foreground mt-2">
              Entre com suas credenciais para acessar o painel
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-11 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded border-input" />
                <span className="text-muted-foreground">Lembrar-me</span>
              </label>
              <a href="#" className="text-sm text-primary hover:underline">
                Esqueceu a senha?
              </a>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isLoading}>
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Precisa de ajuda?{" "}
            <a href="#" className="text-primary hover:underline">
              Contate o suporte
            </a>
          </p>
        </div>
      </div>

      {/* Right side - Branding */}
      <div className="hidden lg:flex flex-1 bg-secondary items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <h2 className="text-3xl font-bold text-secondary-foreground">
            Gerencie suas aplicações SaaS
          </h2>
          <p className="text-secondary-foreground/80">
            Painel centralizado para controle de clientes, licenças, produtos e financeiro de múltiplas aplicações.
          </p>
          <div className="grid grid-cols-2 gap-4 pt-4">
            <div className="bg-secondary-foreground/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-secondary-foreground">500+</p>
              <p className="text-sm text-secondary-foreground/70">Clientes ativos</p>
            </div>
            <div className="bg-secondary-foreground/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-secondary-foreground">12</p>
              <p className="text-sm text-secondary-foreground/70">Produtos SaaS</p>
            </div>
            <div className="bg-secondary-foreground/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-secondary-foreground">2.5k</p>
              <p className="text-sm text-secondary-foreground/70">Licenças ativas</p>
            </div>
            <div className="bg-secondary-foreground/10 rounded-lg p-4">
              <p className="text-2xl font-bold text-secondary-foreground">R$ 1.2M</p>
              <p className="text-sm text-secondary-foreground/70">Receita mensal</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
