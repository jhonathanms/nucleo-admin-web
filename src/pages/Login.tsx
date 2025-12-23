import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Eye,
  EyeOff,
  Mail,
  Linkedin,
  Instagram,
  Sparkles,
  Shield,
  TrendingUp,
  Users,
} from "lucide-react";
import authService from "@/services/auth.service";
import { useApiError } from "@/hooks/use-api-error";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

const REMEMBER_ME_KEY = "nucleo-admin-remember-email";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [isRecovering, setIsRecovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const { apiError, handleError, clearError } = useApiError();
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Trigger entrance animation
  useEffect(() => {
    setTimeout(() => setIsVisible(true), 100);
  }, []);

  // Load remembered email on mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem(REMEMBER_ME_KEY);
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  // Clear error when user starts typing
  useEffect(() => {
    if (apiError && (email || password)) {
      clearError();
    }
  }, [email, password, apiError, clearError]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authService.login({ email, password });

      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, email);
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      console.error("Login failed:", error);
      handleError(error, "Falha no login. Verifique suas credenciais.");
      setTimeout(() => {
        passwordInputRef.current?.focus();
        passwordInputRef.current?.select();
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = () => {
    setRecoveryEmail(email);
    setForgotPasswordOpen(true);
  };

  const handleSendRecoveryEmail = async () => {
    if (!recoveryEmail) {
      toast({
        title: "Email obrigatório",
        description: "Por favor, informe seu email para recuperar a senha.",
        variant: "destructive",
      });
      return;
    }

    setIsRecovering(true);
    try {
      await authService.forgotPassword(recoveryEmail);
      toast({
        title: "Email enviado!",
        description:
          "Se o email existir, você receberá instruções para redefinir sua senha.",
      });
      setForgotPasswordOpen(false);
      setRecoveryEmail("");
    } catch (error) {
      handleError(error, "Não foi possível enviar o email de recuperação.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative z-10">
        {/* Left Side - Form */}
        <div className="flex-1 flex items-center justify-center p-6">
          <div
            className={`w-full max-w-md transition-all duration-1000 ${
              isVisible
                ? "opacity-100 translate-y-0"
                : "opacity-0 translate-y-10"
            }`}
          >
            {/* Logo and Title */}
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center mb-4 relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full blur-xl opacity-50 group-hover:opacity-75 transition-opacity" />
                <div className="relative bg-white rounded-2xl p-3 shadow-2xl transform group-hover:scale-105 transition-transform">
                  <img
                    src="/logo.png"
                    alt="Nucleo Admin"
                    className="h-16 w-16"
                  />
                </div>
              </div>
              <h1 className="text-2xl font-bold text-white mb-1 tracking-tight">
                Núcleo Admin
              </h1>
              <p className="text-blue-200 text-xs">
                Plataforma de Gestão de Licenças SaaS
              </p>
            </div>

            {/* Error Alert */}
            {apiError && (
              <div className="mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                <ApiErrorAlert error={apiError} />
              </div>
            )}

            {/* Form Card */}
            <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 shadow-2xl border border-white/20">
              <form
                onSubmit={handleLogin}
                className="space-y-4"
                autoComplete="off"
              >
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-white text-xs font-medium"
                  >
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoComplete="off"
                    className="h-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                  />
                </div>

                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-white text-xs font-medium"
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      ref={passwordInputRef}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      className="h-11 pr-11 bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-blue-400 focus:ring-blue-400/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(checked) =>
                        setRememberMe(checked as boolean)
                      }
                      className="border-white/30 data-[state=checked]:bg-blue-500"
                    />
                    <label
                      htmlFor="remember"
                      className="text-xs text-white/80 cursor-pointer select-none"
                    >
                      Lembrar-me
                    </label>
                  </div>
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs text-blue-300 hover:text-blue-200 transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-[1.02]"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side - Branding */}
        <div
          className={`hidden lg:flex flex-1 items-center justify-center p-8 transition-all duration-1000 delay-300 ${
            isVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-10"
          }`}
        >
          <div className="max-w-xl text-center space-y-6">
            {/* Main Headline */}
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 rounded-full border border-blue-400/30 mb-2">
                <Sparkles className="h-3.5 w-3.5 text-blue-300" />
                <span className="text-blue-200 text-xs font-medium">
                  Gestão Inteligente
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white leading-tight">
                O núcleo da administração
                <br />
                <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  dos seus sistemas SaaS
                </span>
              </h2>
              <p className="text-sm text-blue-100/80 max-w-md mx-auto">
                Centralize o controle de licenças, monitore assinaturas e
                gerencie todo o ciclo de vida dos seus produtos em uma única
                plataforma.
              </p>
            </div>

            {/* Feature Icons */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 group">
                <Shield className="h-9 w-9 text-blue-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-white text-sm font-semibold">Segurança</p>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Proteção de dados
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 group">
                <Users className="h-9 w-9 text-purple-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-white text-sm font-semibold">
                  Multi-tenancy
                </p>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Gestão de clientes
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 group">
                <TrendingUp className="h-9 w-9 text-green-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-white text-sm font-semibold">Analytics</p>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Métricas em tempo real
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20 hover:bg-white/15 transition-all transform hover:scale-105 group">
                <Sparkles className="h-9 w-9 text-yellow-400 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                <p className="text-white text-sm font-semibold">Automação</p>
                <p className="text-xs text-blue-200/70 mt-0.5">
                  Processos otimizados
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative py-4 px-8 bg-black/20 backdrop-blur-sm border-t border-white/10 z-10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col md:flex-row items-center gap-3 md:gap-6">
            <div className="text-center md:text-left">
              <p className="text-white/90 text-xs font-medium">
                Jhonathan Martins
              </p>
              <p className="text-white/60 text-[10px]">
                Engenheiro de Software
              </p>
            </div>

            <div className="hidden md:block w-px h-6 bg-white/10" />

            <div className="flex items-center gap-4">
              <a
                href="https://www.linkedin.com/in/jhonathan-martins-5b1237143/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-blue-400 transition-all transform hover:scale-110"
                title="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="https://www.instagram.com/jhonathan.martiins?igsh=MXdtczBudjByem02OA=="
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/60 hover:text-pink-400 transition-all transform hover:scale-110"
                title="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <p className="text-white/50 text-[10px] tracking-wider">
            © 2015-2025. Todos os direitos reservados.
          </p>
        </div>
      </footer>

      {/* Forgot Password Modal */}
      <Dialog open={forgotPasswordOpen} onOpenChange={setForgotPasswordOpen}>
        <DialogContent className="sm:max-w-[425px] bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-blue-400" />
              Recuperar Senha
            </DialogTitle>
            <DialogDescription className="text-slate-300">
              Informe seu email e enviaremos instruções para redefinir sua
              senha.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <div className="space-y-2">
              <Label htmlFor="recovery-email" className="text-white">
                E-mail
              </Label>
              <Input
                id="recovery-email"
                type="email"
                placeholder="seu@email.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                autoFocus
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setForgotPasswordOpen(false)}
              disabled={isRecovering}
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSendRecoveryEmail}
              disabled={isRecovering}
              className="bg-gradient-to-r from-blue-600 to-purple-600"
            >
              {isRecovering ? "Enviando..." : "Enviar Email"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
