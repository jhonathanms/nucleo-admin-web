import { useState, useEffect, useCallback } from "react";
import { Building2, Plus } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import clienteService from "@/services/cliente.service";
import {
  Cliente,
  CreateClienteDTO,
  UpdateClienteDTO,
} from "@/types/cliente.types";
import { Status } from "@/types/common.types";
import { useApiError } from "@/hooks/use-api-error";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Clientes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clienteIdParam = queryParams.get("id");

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [clienteEditando, setClienteEditando] = useState<Cliente | null>(null);
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

  // Form states - using Partial<Cliente> to cover all fields including status
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
        // Remove status from creation as it's not in CreateClienteDTO
        const { status, ...createData } = formData;
        await clienteService.create(createData as CreateClienteDTO);
        toast({ title: "Sucesso", description: "Cliente criado com sucesso." });
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
      key: "nome",
      header: "Nome",
      cell: (cliente) => (
        <div>
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
      label: "Editar",
      onClick: (cliente) => handleOpenModal(cliente),
    },
    {
      label: "Ver licenças",
      onClick: (cliente) => {
        navigate(`/licencas?clienteId=${cliente.id}`);
        toast({
          title: "Filtro aplicado",
          description: `Visualizando licenças de ${cliente.nome}`,
        });
      },
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
        description="Gerencie os clientes da plataforma"
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
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

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

          <ApiErrorAlert error={apiError} />

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

            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
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

          <div className="flex justify-end gap-2">
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
          </div>
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
