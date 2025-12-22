import { useState, useEffect, useCallback } from "react";
import {
  Key,
  Plus,
  RefreshCw,
  Ban,
  AlertCircle,
  ExternalLink,
  Filter,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
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
import financeiroService from "@/services/financeiro.service";
import {
  Licenca,
  CreateLicencaDTO,
  UpdateLicencaDTO,
} from "@/types/licenca.types";
import { Cliente } from "@/types/cliente.types";
import { Produto } from "@/types/produto.types";
import { Plano } from "@/types/plano.types";
import { Status } from "@/types/common.types";
import usuarioService from "@/services/usuario.service";
import { Usuario } from "@/types/usuario.types";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Licencas() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const clienteIdParam = queryParams.get("clienteId");

  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingTitulos, setIsCheckingTitulos] = useState(false);
  const [temTitulos, setTemTitulos] = useState(false);
  const navigate = useNavigate();

  // Filtros
  const [filtroProduto, setFiltroProduto] = useState<string>("TODOS");
  const [filtroCliente, setFiltroCliente] = useState<string>(
    clienteIdParam || "TODOS"
  );
  const [filtroPlano, setFiltroPlano] = useState<string>("TODOS");
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [filtroDataExpInicio, setFiltroDataExpInicio] = useState("");
  const [filtroDataExpFim, setFiltroDataExpFim] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [licencaEditando, setLicencaEditando] = useState<Licenca | null>(null);
  const [licencaRenovando, setLicencaRenovando] = useState<Licenca | null>(
    null
  );
  const [mesesRenovacao, setMesesRenovacao] = useState(12);

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

  // Form state
  const [formData, setFormData] = useState<
    Partial<CreateLicencaDTO & { status: Status }>
  >({
    limiteUsuarios: null,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load dependencies first
      const [clientesRes, produtosRes, planosRes, usuariosRes] =
        await Promise.all([
          clienteService.getAll({ size: 100 }),
          produtoService.getAll({ size: 100 }),
          planoService.getAll({ size: 100 }),
          usuarioService.getAll({ size: 1000 }),
        ]);

      setClientes(clientesRes.content);
      setProdutos(produtosRes.content);
      setPlanos(planosRes.content);
      setUsuarios(usuariosRes.content);

      // Load licenses with filters
      const params: Record<string, any> = { size: 100 };

      if (filtroCliente && filtroCliente !== "TODOS")
        params.clienteId = filtroCliente;
      if (filtroProduto && filtroProduto !== "TODOS")
        params.produtoId = filtroProduto;
      if (filtroPlano && filtroPlano !== "TODOS") params.planoId = filtroPlano;
      if (filtroStatus && filtroStatus !== "TODOS")
        params.status = filtroStatus;
      if (filtroDataExpInicio) params.dataExpiracaoInicio = filtroDataExpInicio;
      if (filtroDataExpFim) params.dataExpiracaoFim = filtroDataExpFim;

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
  }, [
    filtroCliente,
    filtroProduto,
    filtroPlano,
    filtroStatus,
    filtroDataExpInicio,
    filtroDataExpFim,
    toast,
  ]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = async (licenca?: Licenca) => {
    setTemTitulos(false);
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

      // Verificar se existem títulos financeiros
      setIsCheckingTitulos(true);
      try {
        const titulosRes = await financeiroService.getAll({
          licencaId: licenca.id,
          size: 1,
        });
        const totalElements =
          (titulosRes as any).totalElements ??
          (Array.isArray(titulosRes) ? titulosRes.length : 0);
        setTemTitulos(totalElements > 0);
      } catch (error) {
        console.error("Erro ao verificar títulos:", error);
      } finally {
        setIsCheckingTitulos(false);
      }
    } else {
      setLicencaEditando(null);
      const hoje = new Date();
      const anoQueVem = new Date();
      anoQueVem.setFullYear(hoje.getFullYear() + 1);

      setFormData({
        clienteId: clienteIdParam || "",
        produtoId: undefined,
        planoId: undefined,
        status: "ATIVO",
        dataInicio: hoje.toISOString().split("T")[0],
        dataExpiracao: anoQueVem.toISOString().split("T")[0],
        limiteUsuarios: null,
      });
    }
    clearError();
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
    } catch (error: any) {
      handleError(error, "Não foi possível salvar a licença.");
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

  const handleSuspender = (licenca: Licenca) => {
    setConfirmModal({
      open: true,
      title: "Suspender Licença",
      description: `Tem certeza que deseja suspender a licença de "${licenca.clienteNome}"?`,
      onConfirm: async () => {
        try {
          await licencaService.suspender(licenca.id);
          toast({
            title: "Sucesso",
            description: "Licença suspensa com sucesso.",
          });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível suspender a licença.");
        }
      },
    });
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
      key: "tagProduto",
      header: "Tag",
      cell: (licenca) => (
        <code className="text-xs bg-muted px-1 rounded">
          {licenca.tagProduto}
        </code>
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
      cell: (licenca) => {
        const count = usuarios.filter(
          (u) => u.clienteId === licenca.clienteId && u.ativo
        ).length;
        return (
          <span className="text-sm">
            {count} / {licenca.limiteUsuarios || "∞"}
          </span>
        );
      },
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

  const limparFiltros = () => {
    setFiltroCliente("TODOS");
    setFiltroProduto("TODOS");
    setFiltroPlano("TODOS");
    setFiltroStatus("TODOS");
    setFiltroDataExpInicio("");
    setFiltroDataExpFim("");
  };

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

      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
      </div>

      {mostrarFiltros && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-medium">
                Filtros Avançados
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="h-8 text-xs"
              >
                <X className="mr-2 h-3 w-3" />
                Limpar Filtros
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Produto</Label>
                <Select value={filtroProduto} onValueChange={setFiltroProduto}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {produtos.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={filtroPlano} onValueChange={setFiltroPlano}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    {planos
                      .filter(
                        (p) =>
                          filtroProduto === "TODOS" ||
                          p.produtoId === filtroProduto
                      )
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos</SelectItem>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="INATIVO">Inativo</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Expiração (Início)</Label>
                <Input
                  type="date"
                  value={filtroDataExpInicio}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (filtroDataExpFim && val > filtroDataExpFim) {
                      toast({
                        title: "Data inválida",
                        description:
                          "Data inicial não pode ser maior que a final.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setFiltroDataExpInicio(val);
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label>Expiração (Fim)</Label>
                <Input
                  type="date"
                  value={filtroDataExpFim}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (filtroDataExpInicio && val < filtroDataExpInicio) {
                      toast({
                        title: "Data inválida",
                        description:
                          "Data final não pode ser menor que a inicial.",
                        variant: "destructive",
                      });
                      return;
                    }
                    setFiltroDataExpFim(val);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

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

          <ApiErrorAlert error={apiError} />

          <div className="space-y-4 py-4">
            {temTitulos && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start mb-4">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-amber-800">
                    Edição Restrita
                  </p>
                  <p className="text-xs text-amber-700">
                    Esta licença possui títulos financeiros vinculados. Alguns
                    campos foram bloqueados para garantir a integridade dos
                    dados.
                  </p>
                  <Button
                    variant="link"
                    className="p-0 h-auto text-xs text-amber-800 font-semibold flex items-center gap-1"
                    onClick={() => {
                      setModalOpen(false);
                      navigate(`/financeiro?licencaId=${licencaEditando?.id}`);
                    }}
                  >
                    Ver títulos no Financeiro
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="cliente">Cliente</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clienteId: value })
                }
                disabled={!!licencaEditando || temTitulos}
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
                  disabled={!!licencaEditando || temTitulos}
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
                  onValueChange={(value) => {
                    const planoSelecionado = planos.find((p) => p.id === value);
                    setFormData({
                      ...formData,
                      planoId: value,
                      limiteUsuarios:
                        planoSelecionado?.limiteUsuarios ??
                        formData.limiteUsuarios,
                    });
                  }}
                  disabled={!!licencaEditando || temTitulos}
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

              <div className="space-y-2">
                <Label htmlFor="tagProduto">Tag do Produto</Label>
                <Input
                  id="tagProduto"
                  value={
                    produtos.find((p) => p.id === formData.produtoId)
                      ?.tagProduto || ""
                  }
                  disabled
                  className="bg-muted"
                />
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
                  disabled={!!licencaEditando || temTitulos}
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
                  disabled={temTitulos}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limiteUsuarios">Limite de Usuários</Label>
              <div className="flex gap-2">
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
                  disabled={temTitulos}
                />
                {formData.planoId && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    title="Restaurar valor do plano"
                    onClick={() => {
                      const plano = planos.find(
                        (p) => p.id === formData.planoId
                      );
                      if (plano)
                        setFormData({
                          ...formData,
                          limiteUsuarios: plano.limiteUsuarios,
                        });
                    }}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                )}
              </div>
              {formData.planoId && (
                <p className="text-[10px] text-muted-foreground">
                  Plano selecionado:{" "}
                  {planos.find((p) => p.id === formData.planoId)?.nome} (
                  {planos.find((p) => p.id === formData.planoId)?.limiteUsuarios
                    ? `${
                        planos.find((p) => p.id === formData.planoId)
                          ?.limiteUsuarios
                      } usuários`
                    : "Ilimitado"}
                  )
                </p>
              )}
            </div>

            {licencaEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Status) =>
                    setFormData({ ...formData, status: value })
                  }
                  // disabled={temTitulos}
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
            <Button
              onClick={handleSalvar}
              disabled={isLoading || isCheckingTitulos}
            >
              {isLoading || isCheckingTitulos ? "Aguarde..." : "Salvar"}
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
