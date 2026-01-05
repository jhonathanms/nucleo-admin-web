import { useState, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserCircle,
  Plus,
  Shield,
  Package,
  Building2,
  Trash2,
  ExternalLink,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import { isPasswordStrong } from "@/lib/password-utils";
import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import licencaService from "@/services/licenca.service";
import { Licenca } from "@/types/licenca.types";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Usuario,
  UsuarioTipo,
  UsuarioVinculo,
  CreateUsuarioDTO,
  UpdateUsuarioDTO,
} from "@/types/usuario.types";
import { UserRole } from "@/types/auth.types";
import { Cliente } from "@/types/cliente.types";
import { useApiError } from "@/hooks/use-api-error";
import authService from "@/services/auth.service";
import { UserAvatar } from "@/components/UserAvatar";
import { AvatarUpload } from "@/components/AvatarUpload";
import { ProdutoLogo } from "@/components/ProdutoLogo";

const perfilLabels: Record<
  UserRole,
  { label: string; variant: "default" | "destructive" | "warning" | "success" }
> = {
  ADMIN: { label: "Administrador", variant: "destructive" },
  GERENTE: { label: "Gerente", variant: "warning" },
  OPERADOR: { label: "Usuário", variant: "default" },
  CLIENTE: { label: "Cliente", variant: "success" },
};

const INITIAL_FORM_DATA = {
  nome: "",
  email: "",
  tipo: "CLIENTE" as UsuarioTipo,
  role: "OPERADOR" as UserRole,
  senha: "",
};

const INITIAL_VINCULO_DATA = {
  clienteId: "",
  licencaId: "",
  role: "OPERADOR" as UserRole,
  isUsuarioPrincipal: false,
};

const isOnline = (ultimoAcesso?: string) => {
  if (!ultimoAcesso) return false;
  const lastAccess = new Date(ultimoAcesso).getTime();
  const now = new Date().getTime();
  const diffInMinutes = (now - lastAccess) / (1000 * 60);
  return diffInMinutes < 10;
};

export default function Usuarios() {
  const navigate = useNavigate();
  const [usuariosInternos, setUsuariosInternos] = useState<Usuario[]>([]);
  const [usuariosClientes, setUsuariosClientes] = useState<Usuario[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "internos";
  const [isLoading, setIsLoading] = useState(true);
  const [modalAberto, setModalAberto] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);
  const [licencas, setLicencas] = useState<Licenca[]>([]);

  // Vinculos State
  const [vinculoModalOpen, setVinculoModalOpen] = useState(false);
  const [vinculoData, setVinculoData] = useState(INITIAL_VINCULO_DATA);
  const [licencasCliente, setLicencasCliente] = useState<Licenca[]>([]);

  // Reset Password State
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetPasswordData, setResetPasswordData] = useState({
    id: "",
    email: "",
    senhaAtual: "",
    novaSenha: "",
    confirmarSenha: "",
  });
  const [showSenhaAtual, setShowSenhaAtual] = useState(false);
  const [showNovaSenha, setShowNovaSenha] = useState(false);
  const [showConfirmarSenha, setShowConfirmarSenha] = useState(false);

  const { toast } = useToast();
  const { apiError, handleError, clearError } = useApiError();

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [internosRes, clientesUsuariosRes, clientesRes, licencasRes] =
        await Promise.all([
          usuarioService.getByTipo("INTERNO"),
          usuarioService.getByTipo("CLIENTE"),
          clienteService.getAll({ size: 100 }),
          licencaService.getAll({ size: 500 }),
        ]);
      setUsuariosInternos(internosRes.content);

      // Processar usuários clientes para incluir string de busca de CRM
      const processedClientes = clientesUsuariosRes.content.map(
        (u: Usuario) => ({
          ...u,
          crmSearch: u.vinculos?.map((v) => v.clienteCodigoCrm).join(" ") || "",
        })
      );

      setUsuariosClientes(processedClientes);
      setClientes(clientesRes.content);
      setLicencas(licencasRes.content);
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
      tipo: usuario.tipo,
      role: usuario.role,
      senha: "",
    });
    clearError();
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      const currentUser = authService.getStoredUser();
      const isEditingSelf = usuarioEditando?.id === currentUser?.id;
      const emailChanged = formData.email !== usuarioEditando?.email;

      const payload: any = {
        nome: formData.nome,
        email: formData.email,
        tipo: formData.tipo,
        role: formData.role,
      };

      if (usuarioEditando) {
        await usuarioService.update(
          usuarioEditando.id,
          payload as UpdateUsuarioDTO
        );

        if (emailChanged) {
          if (isEditingSelf) {
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
          } else if (usuarioEditando.ultimoAcesso) {
            // Se não for o próprio usuário, mas ele já tiver acessado, desloga de outros produtos
            try {
              await usuarioService.logoutFromAll(usuarioEditando.id);
              toast({
                title: "Usuário desconectado",
                description:
                  "O e-mail foi alterado e o usuário foi desconectado de todos os produtos.",
              });
            } catch (e) {
              console.error("Erro ao deslogar de outros produtos:", e);
            }
          }
        }

        toast({ title: "Usuário atualizado com sucesso" });
      } else {
        payload.senha = "Mudar@123";
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
      const novoStatus = !usuario.ativo;
      await usuarioService.updateStatus(usuario.id, novoStatus);
      toast({
        title: novoStatus ? "Usuário ativado" : "Usuário inativado",
        description: `${usuario.nome} foi ${
          novoStatus ? "ativado" : "inativado"
        } com sucesso.`,
      });
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível alterar o status do usuário.");
    }
  };

  const handleAddVinculo = async () => {
    if (!usuarioEditando || !vinculoData.clienteId) return;

    const licencaId =
      vinculoData.licencaId && vinculoData.licencaId !== "none"
        ? vinculoData.licencaId
        : undefined;

    // Validação: Usuário NÃO pode ter múltiplos vínculos com a mesma licença
    const jaPossuiVinculo = usuarioEditando.vinculos?.some((v) => {
      if (licencaId) {
        // Se selecionou uma licença, verifica se já tem vínculo com ELA
        return v.licencaId === licencaId;
      } else {
        // Se não selecionou licença (Acesso Global), verifica se já tem vínculo Global com essa empresa
        return v.clienteId === vinculoData.clienteId && !v.licencaId;
      }
    });

    if (jaPossuiVinculo) {
      toast({
        title: "Vínculo já existe",
        description: licencaId
          ? "Este usuário já possui um vínculo com esta licença."
          : "Este usuário já possui um vínculo global com esta empresa.",
        variant: "destructive",
      });
      return;
    }

    try {
      await usuarioService.addVinculo(usuarioEditando.id, {
        clienteId: vinculoData.clienteId,
        licencaId: licencaId,
        role: vinculoData.role,
      });

      // Se marcado como usuário principal, atualiza a licença
      if (vinculoData.isUsuarioPrincipal && licencaId) {
        await licencaService.update(licencaId, {
          usuarioPrincipalId: usuarioEditando.id,
        });
      }
      toast({ title: "Vínculo adicionado com sucesso" });
      setVinculoModalOpen(false);
      setVinculoData(INITIAL_VINCULO_DATA);

      // Refresh user data to show new vinculo
      const updatedUser = await usuarioService.getById(usuarioEditando.id);
      setUsuarioEditando(updatedUser);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível adicionar o vínculo.");
    }
  };

  const handleRemoveVinculo = async (vinculoId: string) => {
    if (!usuarioEditando) return;

    try {
      await usuarioService.removeVinculo(usuarioEditando.id, vinculoId);
      toast({ title: "Vínculo removido com sucesso" });

      // Refresh user data
      const updatedUser = await usuarioService.getById(usuarioEditando.id);
      setUsuarioEditando(updatedUser);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível remover o vínculo.");
    }
  };

  const openVinculosModal = (usuario: Usuario) => {
    setUsuarioEditando(usuario);
    setVinculoData(INITIAL_VINCULO_DATA);
    setVinculoModalOpen(true);
  };

  const openResetPasswordModal = (usuario: Usuario) => {
    setResetPasswordData({
      id: usuario.id,
      email: usuario.email,
      senhaAtual: "",
      novaSenha: "",
      confirmarSenha: "",
    });
    setShowSenhaAtual(false);
    setShowNovaSenha(false);
    setShowConfirmarSenha(false);
    clearError();
    setResetModalOpen(true);
  };

  const handleConfirmResetPassword = async () => {
    const currentUser = authService.getStoredUser();
    const isEditingSelf = resetPasswordData.id === currentUser?.id;

    if (isEditingSelf && !resetPasswordData.senhaAtual) {
      toast({
        title: "Erro",
        description:
          "A senha atual é obrigatória para alterar sua própria senha.",
        variant: "destructive",
      });
      return;
    }

    if (!resetPasswordData.novaSenha) {
      toast({
        title: "Erro",
        description: "A nova senha é obrigatória.",
        variant: "destructive",
      });
      return;
    }

    if (resetPasswordData.novaSenha !== resetPasswordData.confirmarSenha) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (!isPasswordStrong(resetPasswordData.novaSenha)) {
      toast({
        title: "Senha fraca",
        description: "A senha não atende aos requisitos de segurança.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isEditingSelf) {
        await usuarioService.changePassword(resetPasswordData.id, {
          senhaAtual: resetPasswordData.senhaAtual,
          novaSenha: resetPasswordData.novaSenha,
        });
      } else {
        await usuarioService.resetPassword(resetPasswordData.id, {
          novaSenha: resetPasswordData.novaSenha,
        });
      }

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

  const columnsInternos: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      cell: (usuario) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={usuario.id}
            userName={usuario.nome}
            refreshKey={avatarRefreshKey}
          />
          <div>
            <p className="font-medium">{usuario.nome}</p>
            <p className="text-xs text-muted-foreground">{usuario.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Perfil Admin",
      cell: (usuario) => {
        const role = usuario.role as UserRole;
        const perfilConfig = role ? perfilLabels[role] : undefined;
        const label = perfilConfig ? perfilConfig.label : role || "N/A";
        const variant = perfilConfig ? perfilConfig.variant : "default";

        return <StatusBadge status={label} variant={variant} icon={Shield} />;
      },
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

  const columnsClientes: Column<Usuario>[] = [
    {
      key: "nome",
      header: "Usuário",
      cell: (usuario) => (
        <div className="flex items-center gap-3">
          <UserAvatar
            userId={usuario.id}
            userName={usuario.nome}
            refreshKey={avatarRefreshKey}
          />
          <div>
            <p className="font-medium flex items-center gap-2">
              {usuario.nome}
              {isOnline(usuario.ultimoAcesso) && (
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
      key: "vinculos",
      header: "Clientes / Vínculos",
      cell: (usuario) => {
        if (!usuario.vinculos || usuario.vinculos.length === 0) {
          return (
            <span className="text-xs text-muted-foreground italic">
              Sem vínculos
            </span>
          );
        }

        // Agrupar vínculos por cliente
        const grouped = usuario.vinculos.reduce((acc, v) => {
          const licInfo = v.licencaId
            ? licencas.find((l) => l.id === v.licencaId)
            : null;

          const clienteId = v.clienteId || licInfo?.clienteId;

          if (!clienteId) return acc;

          if (!acc[clienteId]) {
            acc[clienteId] = {
              nome: v.clienteNome || licInfo?.clienteNome || "Cliente",
              codigoCrm:
                v.clienteCodigoCrm || licInfo?.clienteCodigoCrm || "N/A",
              licencas: [],
            };
          }

          acc[clienteId].licencas.push({
            id: v.licencaId,
            nome: licInfo?.produtoNome || v.produtoNome || "Global",
            produtoId: licInfo?.produtoId,
            planoNome: licInfo?.planoNome,
          });
          return acc;
        }, {} as Record<string, { nome: string; codigoCrm: string; licencas: { id?: string; nome: string; produtoId?: string; planoNome?: string }[] }>);

        return (
          <div className="flex flex-col gap-2 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar py-2">
            {Object.entries(grouped).map(([clienteId, data]) => (
              <div
                key={clienteId}
                className="flex items-center gap-2 p-1 pr-2 rounded-full border bg-card hover:bg-accent transition-colors group w-fit"
              >
                <div className="flex items-center gap-1.5 pl-1">
                  <Badge
                    variant="outline"
                    className="font-mono text-[9px] px-1 py-0 h-3.5 border-primary/30 text-primary bg-primary/5"
                  >
                    {data.codigoCrm}
                  </Badge>
                  <Link
                    to={`/clientes?id=${clienteId}`}
                    className="text-xs font-semibold hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {data.nome}
                  </Link>
                </div>

                <div className="flex items-center gap-1 ml-1 pl-2 border-l border-border/50">
                  {data.licencas.map((lic, idx) => (
                    <div key={idx} className="flex items-center">
                      {lic.id ? (
                        <Link
                          to={`/licencas?id=${lic.id}`}
                          className="hover:scale-110 transition-transform"
                        >
                          <ProdutoLogo
                            produtoId={lic.produtoId || ""}
                            produtoNome={lic.nome}
                            planoNome={lic.planoNome}
                            className="h-7 w-7"
                            showTooltip
                          />
                        </Link>
                      ) : (
                        <span className="text-[10px] text-muted-foreground italic px-1">
                          {lic.nome}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        );
      },
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

  const actionsInternos: Action<Usuario>[] = [
    { label: "Editar", onClick: openEditUserModal },
    { label: "Alterar senha", onClick: openResetPasswordModal },
    {
      label: (usuario: Usuario) => (usuario.ativo ? "Inativar" : "Ativar"),
      onClick: handleStatusChange,
    },
  ];

  const actionsClientes: Action<Usuario>[] = [
    { label: "Gerenciar Vínculos", onClick: openVinculosModal },
    { label: "Editar Perfil", onClick: openEditUserModal },
    { label: "Alterar senha", onClick: openResetPasswordModal },
    {
      label: (usuario: Usuario) => (usuario.ativo ? "Inativar" : "Ativar"),
      onClick: handleStatusChange,
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Usuários"
        description="Gerencie os usuários internos e de clientes"
        icon={UserCircle}
        action={{
          label: "Novo Usuário",
          onClick: openNewUserModal,
          icon: Plus,
        }}
      />

      <Tabs
        value={activeTab}
        onValueChange={(value) => setSearchParams({ tab: value })}
        className="w-full flex-1 flex flex-col min-h-0 overflow-hidden"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-6 shrink-0">
          <TabsTrigger value="internos">Usuários Internos</TabsTrigger>
          <TabsTrigger value="clientes">Usuários de Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="internos" className="flex-1 flex flex-col min-h-0">
          <DataTable
            data={usuariosInternos}
            columns={columnsInternos}
            actions={actionsInternos}
            searchKey="nome"
            searchPlaceholder="Buscar usuários internos..."
          />
        </TabsContent>

        <TabsContent value="clientes" className="flex flex-col min-h-0">
          <DataTable
            data={usuariosClientes}
            columns={columnsClientes}
            actions={actionsClientes}
            searchKey={["nome", "email", "crmSearch" as any]}
            searchPlaceholder="Buscar por nome, email ou CRM..."
          />
        </TabsContent>
      </Tabs>

      {/* Modal de Criar/Editar Usuário */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {usuarioEditando ? "Editar Usuário" : "Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {usuarioEditando
                ? "Atualize as informações básicas do usuário"
                : "Cadastre um novo usuário global no sistema"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {usuarioEditando && (
              <div className="flex flex-col items-center justify-center pb-4">
                <Label className="mb-2 self-start">Foto de Perfil</Label>
                <AvatarUpload
                  userId={usuarioEditando.id}
                  userName={usuarioEditando.nome}
                  onUploadSuccess={() =>
                    setAvatarRefreshKey((prev) => prev + 1)
                  }
                  onDeleteSuccess={() =>
                    setAvatarRefreshKey((prev) => prev + 1)
                  }
                />
              </div>
            )}

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
              {usuarioEditando && (
                <p className="text-[10px] text-amber-600 font-medium flex items-start gap-1 mt-1">
                  <AlertCircle className="h-3 w-3 mt-0.5" />
                  <span>
                    Atenção: Se o e-mail for alterado, o usuário será
                    desconectado de todos os produtos ativos por segurança.
                  </span>
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Usuário</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) => handleInputChange("tipo", value)}
                disabled={!!usuarioEditando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INTERNO">
                    Interno (Admin/Operador)
                  </SelectItem>
                  <SelectItem value="CLIENTE">Cliente (Global)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.tipo === "INTERNO" && (
              <div className="space-y-2">
                <Label htmlFor="perfil">Perfil de Acesso (Admin)</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => handleInputChange("role", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o perfil" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="OPERADOR">Usuário</SelectItem>
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

      {/* Modal de Gerenciar Vínculos */}
      <Dialog open={vinculoModalOpen} onOpenChange={setVinculoModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Gerenciar Vínculos: {usuarioEditando?.nome}
            </DialogTitle>
            <DialogDescription>
              Adicione ou remova vínculos deste usuário com clientes e licenças.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">
                  Novo Vínculo
                </CardTitle>
                <CardDescription>Vincular usuário a um cliente</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Cliente</Label>
                  <Select
                    value={vinculoData.clienteId}
                    onValueChange={(value) => {
                      setVinculoData((prev) => ({
                        ...prev,
                        clienteId: value,
                        licencaId: "",
                      }));
                      const filtered = licencas.filter(
                        (l) => l.clienteId === value
                      );
                      setLicencasCliente(filtered);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          <span className="font-mono text-[10px] mr-2 opacity-70">
                            [{c.codigoCrm}]
                          </span>
                          {c.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Licença (Opcional)</Label>
                  <Select
                    value={vinculoData.licencaId}
                    onValueChange={(value) =>
                      setVinculoData((prev) => ({ ...prev, licencaId: value }))
                    }
                    disabled={
                      !vinculoData.clienteId || licencasCliente.length === 0
                    }
                  >
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          licencasCliente.length === 0
                            ? "Nenhuma licença disponível"
                            : "Selecione..."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {licencasCliente.map((l) => (
                        <SelectItem key={l.id} value={l.id}>
                          {l.produtoNome} ({l.chave.substring(0, 8)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Perfil</Label>
                  <Select
                    value={vinculoData.role}
                    onValueChange={(value) =>
                      setVinculoData((prev) => ({
                        ...prev,
                        role: value as UserRole,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                      <SelectItem value="OPERADOR">Usuário</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {vinculoData.licencaId &&
                  vinculoData.licencaId !== "none" &&
                  licencas.find((l) => l.id === vinculoData.licencaId)
                    ?.tipoControle === "DISPOSITIVO" && (
                    <div className="md:col-span-3 flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/20">
                      <Checkbox
                        id="isUsuarioPrincipal"
                        checked={vinculoData.isUsuarioPrincipal}
                        onCheckedChange={(checked) =>
                          setVinculoData((prev) => ({
                            ...prev,
                            isUsuarioPrincipal: checked === true,
                          }))
                        }
                      />
                      <div className="grid gap-1.5 leading-none">
                        <Label
                          htmlFor="isUsuarioPrincipal"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Definir como Usuário Principal desta Licença
                        </Label>
                        <p className="text-[10px] text-muted-foreground">
                          Este usuário será usado para validar novos
                          dispositivos vinculados a esta licença.
                        </p>
                      </div>
                    </div>
                  )}

                <Button
                  className="md:col-span-3 mt-2"
                  onClick={handleAddVinculo}
                  disabled={!vinculoData.clienteId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Vínculo
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="text-sm font-semibold">Vínculos Atuais</h4>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium">
                        Cliente
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Produto/Licença
                      </th>
                      <th className="px-4 py-2 text-left font-medium">
                        Perfil
                      </th>
                      <th className="px-4 py-2 text-right font-medium">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {usuarioEditando?.vinculos &&
                    usuarioEditando.vinculos.length > 0 ? (
                      usuarioEditando.vinculos.map((v) => (
                        <tr key={v.id}>
                          <td className="px-4 py-2 font-medium">
                            {v.clienteNome}
                          </td>
                          <td className="px-4 py-2 text-muted-foreground">
                            {v.licencaId ? (
                              (() => {
                                const licInfo = licencas.find(
                                  (l) => l.id === v.licencaId
                                );
                                return (
                                  <div className="flex items-center gap-2">
                                    <ProdutoLogo
                                      produtoId={licInfo?.produtoId || ""}
                                      produtoNome={
                                        licInfo?.produtoNome ||
                                        v.produtoNome ||
                                        "Produto"
                                      }
                                      planoNome={licInfo?.planoNome}
                                      className="h-8 w-8"
                                      showTooltip
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-sm font-medium text-foreground">
                                        {licInfo?.produtoNome ||
                                          v.produtoNome ||
                                          "Produto"}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        {licInfo?.planoNome && (
                                          <span className="text-[10px] text-primary font-semibold uppercase tracking-wider">
                                            {licInfo.planoNome}
                                          </span>
                                        )}
                                        {v.licencaChave && (
                                          <span className="text-[10px] font-mono opacity-70">
                                            {v.licencaChave.substring(0, 8)}...
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : (
                              <span className="text-xs italic">
                                Acesso Global
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2">
                            <StatusBadge
                              status={
                                v.role === "OPERADOR"
                                  ? "Usuário"
                                  : perfilLabels[v.role as UserRole]
                                  ? perfilLabels[v.role as UserRole].label
                                  : v.role
                              }
                              variant={
                                perfilLabels[v.role as UserRole]
                                  ? perfilLabels[v.role as UserRole].variant
                                  : "secondary"
                              }
                            />
                          </td>
                          <td className="px-4 py-2 text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive h-8 w-8"
                              onClick={() => handleRemoveVinculo(v.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-4 py-8 text-center text-muted-foreground italic"
                        >
                          Nenhum vínculo encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button onClick={() => setVinculoModalOpen(false)}>Fechar</Button>
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
          {/* Hidden input to trap browser autofill */}
          <input
            type="text"
            name="username"
            value={resetPasswordData.email}
            style={{ display: "none" }}
            readOnly
            autoComplete="username"
          />
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              {resetPasswordData.id === authService.getStoredUser()?.id
                ? "Altere sua própria senha de acesso."
                : `Defina uma nova senha para o usuário ${resetPasswordData.email}.`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {resetPasswordData.id === authService.getStoredUser()?.id && (
              <div className="space-y-2">
                <Label htmlFor="senhaAtual">Senha Atual</Label>
                <div className="relative">
                  <Input
                    id="senhaAtual"
                    type={showSenhaAtual ? "text" : "password"}
                    value={resetPasswordData.senhaAtual}
                    onChange={(e) =>
                      setResetPasswordData((prev) => ({
                        ...prev,
                        senhaAtual: e.target.value,
                      }))
                    }
                    placeholder="Digite sua senha atual"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenhaAtual(!showSenhaAtual)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showSenhaAtual ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="novaSenha">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="novaSenha"
                  type={showNovaSenha ? "text" : "password"}
                  value={resetPasswordData.novaSenha}
                  onChange={(e) =>
                    setResetPasswordData((prev) => ({
                      ...prev,
                      novaSenha: e.target.value,
                    }))
                  }
                  placeholder="Digite a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowNovaSenha(!showNovaSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNovaSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {resetPasswordData.novaSenha && (
                <PasswordStrengthMeter password={resetPasswordData.novaSenha} />
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmarSenha">Confirmar Nova Senha</Label>
              <div className="relative">
                <Input
                  id="confirmarSenha"
                  type={showConfirmarSenha ? "text" : "password"}
                  value={resetPasswordData.confirmarSenha}
                  onChange={(e) =>
                    setResetPasswordData((prev) => ({
                      ...prev,
                      confirmarSenha: e.target.value,
                    }))
                  }
                  placeholder="Confirme a nova senha"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmarSenha(!showConfirmarSenha)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {resetPasswordData.confirmarSenha && (
              <Alert
                variant={
                  resetPasswordData.novaSenha ===
                  resetPasswordData.confirmarSenha
                    ? "default"
                    : "destructive"
                }
              >
                <AlertDescription className="flex items-center gap-2">
                  {resetPasswordData.novaSenha ===
                  resetPasswordData.confirmarSenha ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
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
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setResetModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmResetPassword}
              disabled={
                !resetPasswordData.novaSenha ||
                resetPasswordData.novaSenha !==
                  resetPasswordData.confirmarSenha ||
                !isPasswordStrong(resetPasswordData.novaSenha) ||
                (resetPasswordData.id === authService.getStoredUser()?.id &&
                  !resetPasswordData.senhaAtual)
              }
            >
              Confirmar Alteração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
