import { useState, useEffect } from "react";
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

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    id: "",
    email: "",
    novaSenha: "",
  });

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
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
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const openNewUserModal = () => {
    setUsuarioEditando(null);
    setFormData(INITIAL_FORM_DATA);
    setModalAberto(true);
  };

  const openEditUserModal = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    // Try to find if user is linked to a client (this info might be missing in current Usuario type,
    // but we can try to infer or leave as 'none' if not available)
    // For now, we leave as 'none' or we would need to fetch user details if the list doesn't have it.
    setFormData({
      nome: usuario.nome,
      email: usuario.email,
      role: usuario.role,
      clienteId: "none", // TODO: If backend returns clienteId, map it here
      senha: "", // Password not needed for edit
    });
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        role: formData.role,
      };

      if (formData.role === "CLIENTE" && formData.clienteId !== "none") {
        payload.clienteId = formData.clienteId;
      }

      if (usuarioEditando) {
        // Update
        await usuarioService.update(
          usuarioEditando.id,
          payload as UpdateUsuarioDTO
        );
        toast({ title: "Usuário atualizado com sucesso" });
      } else {
        // Create
        payload.senha = formData.senha;
        await usuarioService.create(payload as CreateUsuarioDTO);
        toast({ title: "Usuário criado com sucesso" });
      }
      setModalAberto(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar usuário:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o usuário. Verifique os dados.",
        variant: "destructive",
      });
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
      console.error("Erro ao alterar status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o status do usuário.",
        variant: "destructive",
      });
    }
  };

  const openResetPasswordModal = (usuario: Usuario) => {
    setResetPasswordData({
      id: usuario.id,
      email: usuario.email,
      novaSenha: "",
    });
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
      await usuarioService.resetPassword(resetPasswordData.id, {
        novaSenha: resetPasswordData.novaSenha,
      });
      toast({
        title: "Senha resetada",
        description: `A senha de ${resetPasswordData.email} foi alterada com sucesso.`,
      });
      setResetModalOpen(false);
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      toast({
        title: "Erro",
        description: "Não foi possível resetar a senha.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      cell: (usuario) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10">
            <span className="text-sm font-medium text-primary">
              {usuario.nome
                .split(" ")
                .map((n) => n[0])
                .join("")
                .substring(0, 2)}
            </span>
          </div>
          <div>
            <p className="font-medium">{usuario.nome}</p>
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
      label: "Resetar senha",
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

      <DataTable
        data={usuarios}
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

            {!usuarioEditando && (
              <div className="space-y-2">
                <Label htmlFor="senha">Senha Inicial</Label>
                <Input
                  id="senha"
                  type="password"
                  value={formData.senha}
                  onChange={(e) => handleInputChange("senha", e.target.value)}
                  placeholder="Senha para o primeiro acesso"
                />
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

      {/* Modal de Reset de Senha */}
      <Dialog open={resetModalOpen} onOpenChange={setResetModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>
              Defina uma nova senha para o usuário{" "}
              <strong>{resetPasswordData.email}</strong>.
            </DialogDescription>
          </DialogHeader>

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
