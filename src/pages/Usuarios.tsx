import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserCircle, Plus, Shield } from "lucide-react";
import usuarioService from "@/services/usuario.service";
import clienteService from "@/services/cliente.service";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
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
import { useToast } from "@/hooks/use-toast";

import {
  Usuario,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
} from "@/types/usuario.types";
import { UserRole } from "@/types/auth.types";
import { Cliente } from "@/types/cliente.types";
import { useApiError } from "@/hooks/use-api-error";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import { TokenStorage } from "@/lib/token-storage";
import authService from "@/services/auth.service";

const perfilLabels: Record<
  UserRole,
  { label: string; variant: "default" | "destructive" | "warning" | "success" }
> = {
  ADMIN: { label: "Admin", variant: "destructive" },
  GERENTE: { label: "Gerente", variant: "warning" },
  OPERADOR: { label: "Operador", variant: "default" },
  CLIENTE: { label: "Cliente", variant: "success" },
};

const INITIAL_FORM_DATA = {
  nome: "",
  email: "",
  role: "CLIENTE" as UserRole,
  clienteId: "none",
  senha: "",
};

const isOnline = (ultimoAcesso?: string) => {
  if (!ultimoAcesso) return false;
  const lastAccess = new Date(ultimoAcesso).getTime();
  const now = new Date().getTime();
  const diffInMinutes = (now - lastAccess) / (1000 * 60);
  return diffInMinutes < 10; // Considera online se acessou nos últimos 10 min
};

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    id: "",
    email: "",
    novaSenha: "",
  });

  // Filtros
  const [filtroPerfil, setFiltroPerfil] = useState<UserRole | "todos">("todos");
  const [filtroCliente, setFiltroCliente] = useState<string>("todos");

  const { toast } = useToast();
  const { apiError, handleError, clearError } = useApiError();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [usuariosRes, clientesRes] = await Promise.all([
        usuarioService.getAll(),
        clienteService.getAll({ size: 100 }),
      ]);
      setUsuarios(usuariosRes.content);
      setClientes(clientesRes.content);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openNewUserModal = () => {
    setUsuarioEditando(null);
    setFormData(INITIAL_FORM_DATA);
    clearError();
    setModalAberto(true);
  };

  const openEditUserModal = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      clienteId: usuario.clienteId || "none",
      senha: "",
    });
    clearError();
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      const currentUser = authService.getStoredUser();
      const isEditingSelf = usuarioEditando?.id === currentUser?.id;
      const emailChanged =
        isEditingSelf && formData.email !== usuarioEditando?.email;

      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
      };

      if (formData.role === "CLIENTE" && formData.clienteId !== "none") {
        payload.clienteId = formData.clienteId;
      }

      if (usuarioEditando) {
        await usuarioService.update(
          usuarioEditando.id,
          payload as UpdateUsuarioDTO
        );

        if (emailChanged) {
          setModalAberto(false);
          setIsLoggingOut(true);

          toast({
            title: "E-mail alterado",
            description:
              "Por segurança, você será desconectado para validar o novo acesso.",
            variant: "default",
          });

          setTimeout(async () => {
            await authService.logout();
            navigate("/login", { replace: true });
          }, 3000);
          return;
        }

        toast({ title: "Usuário atualizado com sucesso" });
      } else {
        payload.senha = "Mudar@123"; // Senha padrão inicial
        await usuarioService.create(payload as CreateUsuarioDTO);
        toast({
          title: "Usuário criado com sucesso",
          description: "A senha inicial padrão é: Mudar@123",
        });
      }
      setModalAberto(false);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível salvar o usuário.");
    }
  };

  const handleStatusChange = async (usuario: Usuario) => {
    try {
      await usuarioService.update(usuario.id, { ativo: !usuario.ativo });
      toast({
        title: usuario.ativo ? "Usuário desativado" : "Usuário ativado",
        description: `${usuario.nome} foi ${
          usuario.ativo ? "desativado" : "ativado"
        }.`,
      });
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível alterar o status do usuário.");
    }
  };

  const openResetPasswordModal = (usuario: Usuario) => {
    setResetPasswordData({
      id: usuario.id,
      email: usuario.email,
      novaSenha: "",
    });
    clearError();
    setResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    if (!resetPasswordData.novaSenha) {
      toast({
        title: "Erro",
        description: "A nova senha é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    try {
      const currentUser = authService.getStoredUser();
      const isEditingSelf = resetPasswordData.id === currentUser?.id;

      await usuarioService.resetPassword(resetPasswordData.id, {
        novaSenha: resetPasswordData.novaSenha,
      });

      if (isEditingSelf) {
        setResetModalOpen(false);
        setIsLoggingOut(true);

        toast({
          title: "Senha alterada",
          description:
            "Sua senha foi alterada com sucesso. Por segurança, você será desconectado.",
          variant: "default",
        });

        setTimeout(async () => {
          await authService.logout();
          navigate("/login", { replace: true });
        }, 3000);
        return;
      }

      toast({
        title: "Senha resetada",
        description: `A senha de ${resetPasswordData.email} foi alterada com sucesso.`,
      });
      setResetModalOpen(false);
    } catch (error) {
      handleError(error, "Não foi possível resetar a senha.");
    }
  };

  const columns: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      cell: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 relative">
            <span className="text-sm font-medium text-primary">
              {usuario.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)}
            </span>
            {usuario.role === "CLIENTE" && isOnline(usuario.ultimoAcesso) && (
              <span
                className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background bg-green-500"
                title="Online"
              />
            )}
          </div>
          <div>
            <p className="font-medium flex items-center gap-2">
              {usuario.nome}
              {usuario.role === "CLIENTE" && isOnline(usuario.ultimoAcesso) && (
                <span className="text-[10px] font-bold text-green-500 uppercase tracking-wider">
                  Online
                </span>
              )}
            </p>
            <p className="text-xs text-muted-foreground">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Perfil",
      cell: (usuario) => (
        <StatusBadge
          status={perfilLabels[usuario.role].label}
          variant={perfilLabels[usuario.role].variant}
          icon={Shield}
        />
      ),
    },
    {
      key: "clienteNome",
      header: "Cliente",
      cell: (usuario) => (
        <span className="text-sm">
          {usuario.role === "CLIENTE" && usuario.clienteId ? (
            <Link
              to={`/clientes?id=${usuario.clienteId}`}
              className="text-primary hover:underline font-medium"
            >
              {usuario.clienteNome || "Cliente Desconhecido"}
            </Link>
          ) : (
            <span className="text-muted-foreground">
              {usuario.role === "CLIENTE" ? "Não associado" : "Interno"}
            </span>
          )}
        </span>
      ),
    },
    {
      key: "ativo",
      header: "Status",
      cell: (usuario) => (
        <StatusBadge
          status={usuario.ativo ? "Ativo" : "Inativo"}
          variant={usuario.ativo ? "success" : "muted"}
        />
      ),
    },
    {
      key: "ultimoAcesso",
      header: "Último Acesso",
      cell: (usuario) => (
        <span className="text-sm text-muted-foreground">
          {usuario.ultimoAcesso
            ? new Date(usuario.ultimoAcesso).toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short",
              })
            : "Nunca acessou"}
        </span>
      ),
    },
  ];

  const actions: Action<Usuario>[] = [
    {
      label: "Editar",
      onClick: openEditUserModal,
    },
    {
      label: "Alterar senha",
      onClick: openResetPasswordModal,
    },
    {
      label: "Alterar status",
      onClick: handleStatusChange,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários do sistema"
        icon={UserCircle}
        action={{
          label: "Novo Usuário",
          onClick: openNewUserModal,
          icon: Plus,
        }}
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-48">
          <Select
            value={filtroPerfil}
            onValueChange={(value) =>
              setFiltroPerfil(value as UserRole | "todos")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Perfil" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Perfis</SelectItem>
              <SelectItem value="ADMIN">Admin</SelectItem>
              <SelectItem value="GERENTE">Gerente</SelectItem>
              <SelectItem value="OPERADOR">Operador</SelectItem>
              <SelectItem value="CLIENTE">Cliente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="w-full md:w-64">
          <Select
            value={filtroCliente}
            onValueChange={(value) => setFiltroCliente(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Filtrar por Cliente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Clientes</SelectItem>
              {clientes.map((cliente) => (
                <SelectItem key={cliente.id} value={cliente.id}>
                  {cliente.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={usuarios.filter((u) => {
          const matchPerfil =
            filtroPerfil === "todos" || u.role === filtroPerfil;
          const matchCliente =
            filtroCliente === "todos" || u.clienteId === filtroCliente;
          return matchPerfil && matchCliente;
        })}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      {/* Modal de Criar/Editar Usuário */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {usuarioEditando
                ? "Atualize as informações do usuário"
                : "Cadastre um novo usuário no sistema"}
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} />

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) => handleInputChange("nome", e.target.value)}
                placeholder="Nome completo"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="perfil">Perfil</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o perfil" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="GERENTE">Gerente</SelectItem>
                  <SelectItem value="OPERADOR">Operador</SelectItem>
                  <SelectItem value="CLIENTE">Cliente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.role === "CLIENTE" && (
              <div className="space-y-2">
                <Label htmlFor="cliente">Cliente (Empresa)</Label>
                <Select
                  value={formData.clienteId}
                  onValueChange={(value) =>
                    handleInputChange("clienteId", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      Nenhum (usuário interno)
                    </SelectItem>
                    {clientes.map((cliente) => (
                      <SelectItem key={cliente.id} value={cliente.id}>
                        {cliente.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isLoading}>
              {usuarioEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overlay de Logout */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="flex flex-col items-center gap-4 p-8 rounded-2xl bg-card border shadow-2xl">
            <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
            <div className="text-center">
              <h3 className="text-xl font-bold">Saindo...</h3>
              <p className="text-sm text-muted-foreground">
                Redirecionando para a tela de login
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Alterar Senha */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário{" "}
              <strong>{resetPasswordData.email}</strong>.
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} />

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <Input
                id="novaSenha"
                type="password"
                value={resetPasswordData.novaSenha}
                onChange={(e) =>
                  setResetPasswordData((prev) => ({
                    ...prev,
                    novaSenha: e.target.value,
                  }))
                }
                placeholder="Digite a nova senha"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirmResetPassword}>
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
