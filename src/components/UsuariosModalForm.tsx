import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Usuario,
  UsuarioTipo,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
} from "@/types/usuario.types";
import { UserRole } from "@/types/auth.types";
import { AvatarUpload } from "./AvatarUpload";
import {
  User as UserIcon,
  Mail,
  Shield,
  Briefcase,
  AlertCircle,
  Save,
  UserPlus,
} from "lucide-react";
import { useUser } from "@/contexts/UserContext";
import authService from "@/services/auth.service";

interface UsuariosModalFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  usuario: Usuario | null;
  onSave: (data: any) => Promise<void>;
  isLoading?: boolean;
}

export function UsuariosModalForm({
  open,
  onOpenChange,
  usuario,
  onSave,
  isLoading,
}: UsuariosModalFormProps) {
  const { refreshAvatar, user: loggedInUser } = useUser();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    tipo: "CLIENTE" as UsuarioTipo,
    role: "OPERADOR" as UserRole,
  });

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome,
        email: usuario.email,
        tipo: usuario.tipo,
        role: usuario.role,
      });
    } else {
      setFormData({
        nome: "",
        email: "",
        tipo: "CLIENTE",
        role: "OPERADOR",
      });
    }
  }, [usuario, open]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  const handleAvatarSuccess = () => {
    // Always refresh avatar globally to update all UserAvatar components
    refreshAvatar();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 border-none shadow-2xl bg-background/95 backdrop-blur-xl max-h-[90vh] flex flex-col overflow-hidden">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full overflow-hidden"
        >
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-xl bg-primary/10 text-primary">
                {usuario ? (
                  <UserIcon className="h-5 w-5" />
                ) : (
                  <UserPlus className="h-5 w-5" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">
                  {usuario ? "Editar Usuário" : "Novo Usuário"}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {usuario
                    ? "Atualize as informações básicas e foto de perfil"
                    : "Cadastre um novo usuário global no sistema"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {usuario && (
              <div className="flex flex-col items-center justify-center py-2 bg-muted/30 rounded-2xl border border-border/50">
                <AvatarUpload
                  userId={usuario.id}
                  userName={usuario.nome}
                  onUploadSuccess={handleAvatarSuccess}
                  onDeleteSuccess={handleAvatarSuccess}
                />
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="nome"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                >
                  <UserIcon className="h-3 w-3" /> Nome Completo
                </Label>
                <Input
                  id="nome"
                  value={formData.nome}
                  onChange={(e) => handleInputChange("nome", e.target.value)}
                  placeholder="Ex: João Silva"
                  className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-all"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="email"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" /> E-mail
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="joao@exemplo.com"
                  className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-all"
                  required
                />
              </div>
            </div>

            {usuario && (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600">
                <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                <p className="text-[10px] font-medium leading-relaxed">
                  Atenção: Se o e-mail for alterado, o usuário será desconectado
                  de todos os produtos ativos por segurança.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label
                  htmlFor="tipo"
                  className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                >
                  <Briefcase className="h-3 w-3" /> Tipo de Usuário
                </Label>
                <Select
                  value={formData.tipo}
                  onValueChange={(value) => handleInputChange("tipo", value)}
                  disabled={!!usuario}
                >
                  <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-all">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="INTERNO">
                      Interno (Admin/Operador)
                    </SelectItem>
                    <SelectItem value="CLIENTE">Cliente (Global)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.tipo === "INTERNO" && (
                <div className="space-y-2">
                  <Label
                    htmlFor="role"
                    className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2"
                  >
                    <Shield className="h-3 w-3" /> Perfil de Acesso
                  </Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value) => handleInputChange("role", value)}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/50 border-border/50 focus:bg-background transition-all">
                      <SelectValue placeholder="Selecione o perfil" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="ADMIN">Administrador</SelectItem>
                      <SelectItem value="OPERADOR">Operador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {!usuario && (
              <div className="p-3 rounded-xl bg-primary/5 border border-primary/10 text-primary">
                <p className="text-[10px] font-medium text-center">
                  A senha inicial padrão para novos usuários é:{" "}
                  <span className="font-bold">Mudar@123</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 p-6 pt-4 gap-3 border-t border-border/50 bg-background/95">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl font-semibold hover:bg-muted"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 px-8 rounded-xl font-semibold shadow-lg shadow-primary/20 gap-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {usuario ? "Salvar Alterações" : "Criar Usuário"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
