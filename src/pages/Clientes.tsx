import { useState, useEffect, useCallback } from "react";
import {
  Building2,
  Plus,
  Users,
  Package,
  ExternalLink,
  Shield,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
import { ProdutoLogo } from "@/components/ProdutoLogo";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import clienteService from "@/services/cliente.service";
import licencaService from "@/services/licenca.service";
import usuarioService from "@/services/usuario.service";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/types/cliente.types";
import { Licenca } from "@/types/licenca.types";
import { Usuario } from "@/types/usuario.types";
import { Status } from "@/types/common.types";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { UserAvatar } from "@/components/UserAvatar";

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clienteIdParam = queryParams.get("id");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);

  // Detalhes State
  const [detalhesModalOpen, setDetalhesModalOpen] = useState(false);
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(
    null
  );
  const [usuariosVinculados, setUsuariosVinculados] = useState<Usuario[]>([]);
  const [licencasCliente, setLicencasCliente] = useState<Licenca[]>([]);
  const [isLoadingDetalhes, setIsLoadingDetalhes] = useState(false);

  const { toast } = useToast();
  const { apiError, handleError, clearError } = useApiError();

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
  });

  const [formData, setFormData] = useState<Partial<Cliente>>({
    tipo: "PJ",
    status: "ATIVO",
  });

  const loadClientes = useCallback(async () => {
    setIsLoading(true);
    try {
      if (clienteIdParam) {
        const cliente = await clienteService.getById(clienteIdParam);
        setClientes([cliente]);
      } else {
        const response = await clienteService.getAll({ size: 100 });
        setClientes(response.content);
      }
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de clientes.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [clienteIdParam, toast]);

  useEffect(() => {
    loadClientes();
  }, [loadClientes]);

  const handleOpenModal = (cliente?: Cliente) => {
    if (cliente) {
      setClienteEditando(cliente);
      setFormData({
        nome: cliente.nome,
        codigoCrm: cliente.codigoCrm,
        documento: cliente.documento,
        tipo: cliente.tipo,
        email: cliente.email,
        telefone: cliente.telefone,
        status: cliente.status,
      });
    } else {
      setClienteEditando(null);
      setFormData({
        tipo: "PJ",
        status: "ATIVO",
      });
    }
    clearError();
    setModalAberto(true);
  };

  const handleOpenDetalhes = async (cliente: Cliente) => {
    setClienteSelecionado(cliente);
    setDetalhesModalOpen(true);
    setIsLoadingDetalhes(true);
    try {
      const [usuarios, licencas] = await Promise.all([
        clienteService.getUsuarios(cliente.id),
        licencaService.getByCliente(cliente.id),
      ]);
      setUsuariosVinculados(usuarios);
      setLicencasCliente(licencas.content);
    } catch (error) {
      handleError(error, "Não foi possível carregar os detalhes do cliente.");
    } finally {
      setIsLoadingDetalhes(false);
    }
  };

  const handleSalvar = async () => {
    try {
      if (!formData.nome || !formData.documento || !formData.email) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome, documento e email.",
          variant: "destructive",
        });
        return;
      }

      if (clienteEditando) {
        await clienteService.update(
          clienteEditando.id,
          formData as UpdateClienteDTO
        );
        toast({
          title: "Sucesso",
          description: "Cliente atualizado com sucesso.",
        });
      } else {
        const { status, ...createData } = formData;
        const novoCliente = await clienteService.create(
          createData as CreateClienteDTO
        );

        // Criar usuário principal automaticamente
        try {
          const senhaPadrao =
            formData.documento?.replace(/\D/g, "") || "123456";
          const novoUsuario = await usuarioService.create({
            nome: novoCliente.nome,
            email: novoCliente.email,
            senha: senhaPadrao,
            tipo: "CLIENTE",
            role: "OPERADOR",
          });

          // Criar vínculo global com o cliente (Admin do Cliente)
          await usuarioService.addVinculo(novoUsuario.id, {
            clienteId: novoCliente.id,
            role: "ADMIN",
          });

          toast({
            title: "Sucesso",
            description: "Cliente e usuário principal criados com sucesso.",
          });
        } catch (err) {
          console.error("Erro ao criar usuário automático:", err);
          toast({
            title: "Sucesso",
            description:
              "Cliente criado, mas houve um erro ao criar o usuário automático.",
          });
        }
      }

      setModalAberto(false);
      loadClientes();
    } catch (error) {
      handleError(error, "Não foi possível salvar o cliente.");
    }
  };

  const handleDelete = (cliente: Cliente) => {
    setConfirmModal({
      open: true,
      title: "Excluir Cliente",
      description: `Tem certeza que deseja excluir o cliente "${cliente.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await clienteService.delete(cliente.id);
          toast({
            title: "Sucesso",
            description: "Cliente excluído com sucesso.",
          });
          loadClientes();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível excluir o cliente.");
        }
      },
    });
  };

  const columns: Column<Cliente>[] = [
    {
      key: "codigoCrm",
      header: "CRM",
      cell: (cliente) => (
        <Badge
          variant="outline"
          className="font-mono text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary bg-primary/5"
        >
          {cliente.codigoCrm}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      key: "nome",
      header: "Cliente / Empresa",
      cell: (cliente) => (
        <div className="flex flex-col">
          <p className="font-medium">{cliente.nome}</p>
          <p className="text-xs text-muted-foreground">{cliente.documento}</p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (cliente) => (
        <span className="text-sm">
          {cliente.tipo === "PJ" ? "Pessoa Jurídica" : "Pessoa Física"}
        </span>
      ),
    },
    {
      key: "email",
      header: "Contato",
      cell: (cliente) => (
        <div>
          <p className="text-sm">{cliente.email}</p>
          <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (cliente) => (
        <StatusBadge
          status={cliente.status}
          variant={getStatusVariant(cliente.status)}
        />
      ),
    },
    {
      key: "criadoEm",
      header: "Criado em",
      cell: (cliente) => (
        <span className="text-sm text-muted-foreground">
          {new Date(cliente.criadoEm).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const actions: Action<Cliente>[] = [
    {
      label: "Detalhes",
      onClick: handleOpenDetalhes,
    },
    {
      label: "Editar",
      onClick: (cliente) => handleOpenModal(cliente),
    },
    {
      label: "Excluir",
      onClick: handleDelete,
      variant: "destructive",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes"
        description="Gerencie as empresas e usuários vinculados"
        icon={Building2}
        action={{
          label: "Novo Cliente",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      <DataTable
        data={clientes}
        columns={columns}
        actions={actions}
        searchKey={["nome", "codigoCrm", "documento"]}
        searchPlaceholder="Buscar por nome, CRM ou documento..."
      />

      {/* Modal de Criar/Editar Cliente */}
      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {clienteEditando ? "Editar Cliente" : "Novo Cliente"}
            </DialogTitle>
            <DialogDescription>
              {clienteEditando
                ? "Atualize as informações do cliente"
                : "Preencha os dados para cadastrar um novo cliente"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: "PF" | "PJ") =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PF">Pessoa Física</SelectItem>
                  <SelectItem value="PJ">Pessoa Jurídica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="nome">Nome / Razão Social</Label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Nome completo ou razão social"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="documento">CPF/CNPJ</Label>
              <Input
                id="documento"
                value={formData.documento || ""}
                onChange={(e) =>
                  setFormData({ ...formData, documento: e.target.value })
                }
                placeholder="000.000.000-00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@exemplo.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(00) 00000-0000"
              />
            </div>

            {clienteEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status as string}
                  onValueChange={(value: Status) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INADIMPLENTE">Inadimplente</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
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
              {isLoading
                ? "Salvando..."
                : clienteEditando
                ? "Salvar"
                : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Detalhes do Cliente */}
      <Dialog open={detalhesModalOpen} onOpenChange={setDetalhesModalOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <span>{clienteSelecionado?.nome}</span>
              </div>
              <Badge
                variant="outline"
                className="font-mono text-xs border-primary/30 text-primary"
              >
                {clienteSelecionado?.codigoCrm}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informações detalhadas, usuários e licenças vinculadas.
            </DialogDescription>
          </DialogHeader>

          {isLoadingDetalhes ? (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="h-8 w-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">
                Carregando detalhes...
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* Coluna 1: Usuários */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Usuários Vinculados ({usuariosVinculados.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/usuarios")}
                  >
                    Gerenciar <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {usuariosVinculados.length > 0 ? (
                    usuariosVinculados.map((u) => (
                      <div
                        key={u.id}
                        className="flex items-center justify-between p-3 border rounded-lg bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            userId={u.id}
                            userName={u.nome}
                            className="h-8 w-8"
                          />
                          <div>
                            <p className="text-sm font-medium">{u.nome}</p>
                            <p className="text-[10px] text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          {u.vinculos?.find(
                            (v) => v.clienteId === clienteSelecionado?.id
                          )?.role || "OPERADOR"}
                        </Badge>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                      Nenhum usuário vinculado.
                    </p>
                  )}
                </div>
              </div>

              {/* Coluna 2: Licenças e Produtos */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Licenças Ativas ({licencasCliente.length})
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      navigate(`/licencas?clienteId=${clienteSelecionado?.id}`)
                    }
                  >
                    Ver Todas <ExternalLink className="h-3 w-3 ml-1" />
                  </Button>
                </div>

                <div className="space-y-2">
                  {licencasCliente.length > 0 ? (
                    licencasCliente.map((l) => (
                      <div
                        key={l.id}
                        className="p-3 border rounded-lg bg-card space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <ProdutoLogo
                              produtoId={l.produtoId}
                              produtoNome={l.produtoNome}
                              planoNome={l.planoNome}
                              className="h-8 w-8"
                              showTooltip
                            />
                            <p className="text-sm font-bold">{l.produtoNome}</p>
                          </div>
                          <StatusBadge
                            status={l.status}
                            variant={getStatusVariant(l.status)}
                            className="text-[10px] h-5"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[10px]">
                          <div>
                            <p className="text-muted-foreground">Plano</p>
                            <p className="font-medium">{l.planoNome}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Expiração</p>
                            <p className="font-medium">
                              {new Date(l.dataExpiracao).toLocaleDateString(
                                "pt-BR"
                              )}
                            </p>
                          </div>
                        </div>
                        <div className="pt-1 border-t flex justify-between items-center">
                          <code className="text-[9px] bg-muted px-1 rounded">
                            {l.chave.substring(0, 12)}...
                          </code>
                          <span className="text-[9px] text-muted-foreground">
                            {l.usuariosAtivos} / {l.limiteUsuarios || "∞"}{" "}
                            usuários
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg border-dashed">
                      Nenhuma licença encontrada.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDetalhesModalOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={confirmModal.open}
        onOpenChange={(open) => setConfirmModal((prev) => ({ ...prev, open }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        description={confirmModal.description}
        variant="destructive"
      />
    </div>
  );
}
