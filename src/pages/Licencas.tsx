import { useState, useEffect } from "react";
import { Key, Plus, RefreshCw, Ban } from "lucide-react";
import { useLocation } from "react-router-dom";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
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
import licencaService from "@/services/licenca.service";
import clienteService from "@/services/cliente.service";
import produtoService from "@/services/produto.service";
import planoService from "@/services/plano.service";
import {
  Licenca,
  CreateLicencaDTO,
  UpdateLicencaDTO,
} from "@/types/licenca.types";
import { Cliente } from "@/types/cliente.types";
import { Produto } from "@/types/produto.types";
import { Plano } from "@/types/plano.types";
import { Status } from "@/types/common.types";

export default function Licencas() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clienteIdParam = queryParams.get("clienteId");

  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [licencaEditando, setLicencaEditando] = useState<Licenca | null>(null);
  const [licencaRenovando, setLicencaRenovando] = useState<Licenca | null>(
    null
  );
  const [mesesRenovacao, setMesesRenovacao] = useState(12);

  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState<
    Partial<CreateLicencaDTO & { status: Status }>
  >({
    limiteUsuarios: null,
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load dependencies first
      const [clientesRes, produtosRes, planosRes] = await Promise.all([
        clienteService.getAll({ size: 100 }),
        produtoService.getAll({ size: 100 }),
        planoService.getAll({ size: 100 }),
      ]);

      setClientes(clientesRes.content);
      setProdutos(produtosRes.content);
      setPlanos(planosRes.content);

      // Load licenses, optionally filtered by client
      const params: Record<string, any> = { size: 100 };
      if (clienteIdParam) {
        params.clienteId = clienteIdParam;
      }

      const licencasRes = await licencaService.getAll(params);
      setLicencas(licencasRes.content);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as licenças.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [clienteIdParam]);

  const handleOpenModal = (licenca?: Licenca) => {
    if (licenca) {
      setLicencaEditando(licenca);
      setFormData({
        clienteId: licenca.clienteId,
        produtoId: licenca.produtoId,
        planoId: licenca.planoId,
        dataInicio: licenca.dataInicio.split("T")[0],
        dataExpiracao: licenca.dataExpiracao.split("T")[0],
        limiteUsuarios: licenca.limiteUsuarios,
        status: licenca.status,
      });
    } else {
      setLicencaEditando(null);
      const hoje = new Date();
      const anoQueVem = new Date();
      anoQueVem.setFullYear(hoje.getFullYear() + 1);

      setFormData({
        clienteId: clienteIdParam || "",
        dataInicio: hoje.toISOString().split("T")[0],
        dataExpiracao: anoQueVem.toISOString().split("T")[0],
        limiteUsuarios: null,
      });
    }
    setModalOpen(true);
  };

  const handleSalvar = async () => {
    try {
      if (
        !formData.clienteId ||
        !formData.produtoId ||
        !formData.planoId ||
        !formData.dataInicio ||
        !formData.dataExpiracao
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (licencaEditando) {
        const updatePayload: UpdateLicencaDTO = {
          status: formData.status,
          dataExpiracao: new Date(formData.dataExpiracao).toISOString(),
          limiteUsuarios: formData.limiteUsuarios,
        };
        await licencaService.update(licencaEditando.id, updatePayload);
        toast({
          title: "Sucesso",
          description: "Licença atualizada com sucesso.",
        });
      } else {
        const createPayload: CreateLicencaDTO = {
          clienteId: formData.clienteId,
          produtoId: formData.produtoId,
          planoId: formData.planoId,
          dataInicio: new Date(formData.dataInicio).toISOString(),
          dataExpiracao: new Date(formData.dataExpiracao).toISOString(),
          limiteUsuarios: formData.limiteUsuarios,
        };
        await licencaService.create(createPayload);
        toast({ title: "Sucesso", description: "Licença criada com sucesso." });
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar licença:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a licença.",
        variant: "destructive",
      });
    }
  };

  const handleRenovar = async () => {
    if (!licencaRenovando) return;

    try {
      await licencaService.renovar(licencaRenovando.id, {
        meses: mesesRenovacao,
      });
      toast({ title: "Sucesso", description: "Licença renovada com sucesso." });
      setRenovarModalOpen(false);
      setLicencaRenovando(null);
      loadData();
    } catch (error) {
      console.error("Erro ao renovar licença:", error);
      toast({
        title: "Erro",
        description: "Não foi possível renovar a licença.",
        variant: "destructive",
      });
    }
  };

  const handleSuspender = async (licenca: Licenca) => {
    if (
      !confirm(
        `Tem certeza que deseja suspender a licença de ${licenca.clienteNome}?`
      )
    )
      return;

    try {
      await licencaService.suspender(licenca.id);
      toast({ title: "Sucesso", description: "Licença suspensa com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao suspender licença:", error);
      toast({
        title: "Erro",
        description: "Não foi possível suspender a licença.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Licenca>[] = [
    {
      key: "clienteNome",
      header: "Cliente",
      cell: (licenca) => (
        <div>
          <p className="font-medium">{licenca.clienteNome}</p>
          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
            {licenca.chave}
          </p>
        </div>
      ),
    },
    {
      key: "produtoNome",
      header: "Produto/Plano",
      cell: (licenca) => (
        <div>
          <p className="text-sm font-medium">{licenca.produtoNome}</p>
          <p className="text-xs text-muted-foreground">{licenca.planoNome}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (licenca) => (
        <StatusBadge
          status={licenca.status}
          variant={
            licenca.status === "ATIVO"
              ? "success"
              : licenca.status === "TRIAL"
              ? "info"
              : licenca.status === "SUSPENSO"
              ? "warning"
              : "muted"
          }
        />
      ),
    },
    {
      key: "dataExpiracao",
      header: "Expira em",
      cell: (licenca) => (
        <span className="text-sm">
          {new Date(licenca.dataExpiracao).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "usuariosAtivos",
      header: "Usuários",
      cell: (licenca) => (
        <span className="text-sm">
          {licenca.usuariosAtivos} / {licenca.limiteUsuarios || "∞"}
        </span>
      ),
    },
  ];

  const actions: Action<Licenca>[] = [
    {
      label: "Editar",
      onClick: (licenca) => handleOpenModal(licenca),
    },
    {
      label: "Renovar",
      onClick: (licenca) => {
        setLicencaRenovando(licenca);
        setMesesRenovacao(12);
        setRenovarModalOpen(true);
      },
      icon: RefreshCw,
    },
    {
      label: "Suspender",
      onClick: handleSuspender,
      variant: "destructive",
      icon: Ban,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Licenças"
        description="Gerencie as licenças de uso"
        icon={Key}
        action={{
          label: "Nova Licença",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      <DataTable
        data={licencas}
        columns={columns}
        actions={actions}
        searchKey="clienteNome"
        searchPlaceholder="Buscar por cliente..."
      />

      {/* Modal de Criar/Editar Licença */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {licencaEditando ? "Editar Licença" : "Nova Licença"}
            </DialogTitle>
            <DialogDescription>
              {licencaEditando
                ? "Atualize as informações da licença"
                : "Preencha os dados para gerar uma nova licença"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clienteId: value })
                }
                disabled={!!licencaEditando}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clientes.map((cliente) => (
                    <SelectItem key={cliente.id} value={cliente.id}>
                      {cliente.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <Select
                  value={formData.produtoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, produtoId: value })
                  }
                  disabled={!!licencaEditando}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o produto" />
                  </SelectTrigger>
                  <SelectContent>
                    {produtos.map((produto) => (
                      <SelectItem key={produto.id} value={produto.id}>
                        {produto.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plano">Plano</Label>
                <Select
                  value={formData.planoId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, planoId: value })
                  }
                  disabled={!!licencaEditando}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o plano" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos
                      .filter(
                        (p) =>
                          !formData.produtoId ||
                          p.produtoId === formData.produtoId
                      )
                      .map((plano) => (
                        <SelectItem key={plano.id} value={plano.id}>
                          {plano.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dataInicio">Data Início</Label>
                <Input
                  id="dataInicio"
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicio: e.target.value })
                  }
                  disabled={!!licencaEditando}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dataExpiracao">Data Expiração</Label>
                <Input
                  id="dataExpiracao"
                  type="date"
                  value={formData.dataExpiracao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataExpiracao: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limiteUsuarios">Limite de Usuários</Label>
              <Input
                id="limiteUsuarios"
                type="number"
                value={formData.limiteUsuarios || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    limiteUsuarios: e.target.value
                      ? parseInt(e.target.value)
                      : null,
                  })
                }
                placeholder="Deixe vazio para ilimitado"
              />
            </div>

            {licencaEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Status) =>
                    setFormData({ ...formData, status: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Renovação */}
      <Dialog open={renovarModalOpen} onOpenChange={setRenovarModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar Licença</DialogTitle>
            <DialogDescription>
              Estender a validade da licença
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="meses">Meses adicionais</Label>
              <Input
                id="meses"
                type="number"
                min="1"
                value={mesesRenovacao}
                onChange={(e) => setMesesRenovacao(parseInt(e.target.value))}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setRenovarModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleRenovar}>Confirmar Renovação</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
