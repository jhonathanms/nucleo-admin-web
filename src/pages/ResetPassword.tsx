import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import authService from "@/services/auth.service";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { isPasswordStrong } from "@/lib/password-utils";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [isValidating, setIsValidating] = useState(true);
  const [isValid, setIsValid] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Validate token on mount
  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      toast({
        title: "Token inválido",
        description: "O link de recuperação está inválido ou expirado.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    setToken(tokenParam);
    validateToken(tokenParam);
  }, [searchParams, navigate, toast]);

  const validateToken = async (tokenValue: string) => {
    try {
      const response = await authService.validateResetToken(tokenValue);
      if (response.valido && response.email) {
        setIsValid(true);
        setEmail(response.email);
      } else {
        setIsValid(false);
        toast({
          title: "Token inválido",
          description: "Este link de recuperação está inválido ou expirado.",
          variant: "destructive",
        });
        setTimeout(() => navigate("/login"), 3000);
      }
    } catch (error) {
      console.error("Token validation failed:", error);
      setIsValid(false);
      toast({
        title: "Erro ao validar token",
        description: "Não foi possível validar o link de recuperação.",
        variant: "destructive",
      });
      setTimeout(() => navigate("/login"), 3000);
    } finally {
      setIsValidating(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password strength
    if (!isPasswordStrong(newPassword)) {
      toast({
        title: "Senha fraca",
        description: "A senha não atende aos requisitos de segurança.",
        variant: "destructive",
      });
      return;
    }

    // Validate password confirmation
    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas digitadas não são iguais.",
        variant: "destructive",
      });
      return;
    }

    setIsResetting(true);
    try {
      await authService.resetPassword(token, newPassword);
      toast({
        title: "Senha redefinida!",
        description:
          "Sua senha foi alterada com sucesso. Redirecionando para o login...",
      });
      setTimeout(() => navigate("/login"), 2000);
    } catch (error) {
      console.error("Password reset failed:", error);
      toast({
        title: "Erro ao redefinir senha",
        description: "Não foi possível redefinir sua senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsResetting(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="text-muted-foreground">
                Validando link de recuperação...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <XCircle className="h-16 w-16 text-destructive" />
              <div>
                <h3 className="text-lg font-semibold">Link Inválido</h3>
                <p className="text-sm text-muted-foreground mt-2">
                  Este link de recuperação está inválido ou expirado.
                </p>
                <p className="text-sm text-muted-foreground">
                  Você será redirecionado para a página de login.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const passwordsMatch =
    newPassword && confirmPassword && newPassword === confirmPassword;

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <img src="/logo.png" alt="Nucleo Admin" className="h-12 w-12" />
          </div>
          <CardTitle className="text-2xl">Redefinir Senha</CardTitle>
          <CardDescription>
            Crie uma senha forte para a conta: <strong>{email}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="Digite sua nova senha"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {newPassword && <PasswordStrengthMeter password={newPassword} />}

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Digite novamente a nova senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {confirmPassword && (
              <Alert variant={passwordsMatch ? "default" : "destructive"}>
                <AlertDescription className="flex items-center gap-2">
                  {passwordsMatch ? (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      <span>As senhas coincidem</span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-4 w-4" />
                      <span>As senhas não coincidem</span>
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={
                isResetting ||
                !newPassword ||
                !confirmPassword ||
                !passwordsMatch ||
                !isPasswordStrong(newPassword)
              }
            >
              {isResetting ? "Redefinindo..." : "Redefinir Senha"}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="text-sm text-muted-foreground hover:text-primary hover:underline"
              >
                Voltar para o login
              </button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
