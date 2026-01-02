import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Key,
  Plus,
  RefreshCw,
  Ban,
  AlertCircle,
  ExternalLink,
  Filter,
  X,
  Package,
  Building2,
  Users,
  Smartphone,
  Shield,
  ShieldAlert,
  Monitor,
  Tablet,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { cn } from "@/lib/utils";
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
import { useToast } from "@/hooks/use-toast";
import licencaService from "@/services/licenca.service";
import clienteService from "@/services/cliente.service";
import usuarioService from "@/services/usuario.service";
import dispositivoService from "@/services/dispositivo.service";
import {
  Dispositivo,
  TipoDispositivo,
  StatusDispositivo,
} from "@/types/dispositivo.types";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import produtoService from "@/services/produto.service";
import planoService from "@/services/plano.service";
import financeiroService from "@/services/financeiro.service";
import {
  Licenca,
  CreateLicencaDTO,
  UpdateLicencaDTO,
} from "@/types/licenca.types";
import { Cliente } from "@/types/cliente.types";
import { Usuario } from "@/types/usuario.types";
import { Produto } from "@/types/produto.types";
import { Plano } from "@/types/plano.types";
import { Status } from "@/types/common.types";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Licencas() {
  const location = useLocation();
  const queryParams = useMemo(
    () => new URLSearchParams(location.search),
    [location.search]
  );
  const clienteIdParam = queryParams.get("clienteId");

  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [temTitulos, setTemTitulos] = useState(false);
  const navigate = useNavigate();

  // Filtros
  const [filtroProduto, setFiltroProduto] = useState<string>("TODOS");
  const [filtroCliente, setFiltroCliente] = useState<string>(
    clienteIdParam || "TODOS"
  );
  const [filtroStatus, setFiltroStatus] = useState<string>("TODOS");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [renovarModalOpen, setRenovarModalOpen] = useState(false);
  const [licencaEditando, setLicencaEditando] = useState<Licenca | null>(null);
  const [licencaRenovando, setLicencaRenovando] = useState<Licenca | null>(
    null
  );
  const [mesesRenovacao, setMesesRenovacao] = useState(12);
  const [dispositivosModalOpen, setDispositivosModalOpen] = useState(false);
  const [licencaDispositivos, setLicencaDispositivos] =
    useState<Licenca | null>(null);
  const [dispositivos, setDispositivos] = useState<Dispositivo[]>([]);
  const [isCarregandoDispositivos, setIsCarregandoDispositivos] =
    useState(false);
  const [usuariosCliente, setUsuariosCliente] = useState<Usuario[]>([]);
  const [isCarregandoUsuarios, setIsCarregandoUsuarios] = useState(false);

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

  const [formData, setFormData] = useState<
    Partial<CreateLicencaDTO & { status: Status }>
  >({
    limiteUsuarios: null,
    limiteDispositivos: null,
    tipoControle: "USUARIO",
    usuarioPrincipalId: null,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [clientesRes, produtosRes, planosRes] = await Promise.all([
        clienteService.getAll({ size: 100 }),
        produtoService.getAll({ size: 100 }),
        planoService.getAll({ size: 100 }),
      ]);

      setClientes(clientesRes.content);
      setProdutos(produtosRes.content);
      setPlanos(planosRes.content);

      const params: Record<string, any> = { size: 100 };
      if (filtroCliente !== "TODOS") params.clienteId = filtroCliente;
      if (filtroProduto !== "TODOS") params.produtoId = filtroProduto;
      if (filtroStatus !== "TODOS") params.status = filtroStatus;

      const licencasRes = await licencaService.getAll(params);
      setLicencas(licencasRes.content);
    } catch (error) {
      handleError(error, "Não foi possível carregar as licenças.");
    } finally {
      setIsLoading(false);
    }
  }, [filtroCliente, filtroProduto, filtroStatus, handleError]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = useCallback(
    async (licenca?: Licenca) => {
      setTemTitulos(false);
      if (licenca) {
        let licencaDetalhada = licenca;
        try {
          // Busca detalhes completos para garantir que campos como usuarioPrincipalId estejam presentes
          licencaDetalhada = await licencaService.getById(licenca.id);
        } catch (error) {
          console.error("Erro ao carregar detalhes da licença:", error);
        }

        setLicencaEditando(licencaDetalhada);
        const normalizeTipoControle = (
          tipo: string,
          cobranca?: string
        ): "USUARIO" | "DISPOSITIVO" => {
          if (
            tipo === "POR_DISPOSITIVO" ||
            tipo === "DISPOSITIVO" ||
            cobranca === "POR_DISPOSITIVO"
          )
            return "DISPOSITIVO";
          return "USUARIO";
        };

        setFormData({
          clienteId: licencaDetalhada.clienteId,
          produtoId: licencaDetalhada.produtoId,
          planoId: licencaDetalhada.planoId,
          dataInicio: licencaDetalhada.dataInicio.split("T")[0],
          dataExpiracao: licencaDetalhada.dataExpiracao.split("T")[0],
          limiteUsuarios: licencaDetalhada.limiteUsuarios,
          limiteDispositivos: licencaDetalhada.limiteDispositivos,
          tipoControle: normalizeTipoControle(
            licencaDetalhada.tipoControle,
            licencaDetalhada.tipoCobranca
          ),
          usuarioPrincipalId: licencaDetalhada.usuarioPrincipalId,
          status: licencaDetalhada.status,
        });

        try {
          if (licenca.clienteId) {
            setIsCarregandoUsuarios(true);
            const res = await usuarioService.getByCliente(licenca.clienteId);
            setUsuariosCliente(Array.isArray(res) ? res : res?.content || []);
          }
        } catch (error) {
          console.error("Erro ao carregar usuários do cliente:", error);
        } finally {
          setIsCarregandoUsuarios(false);
        }

        try {
          const titulosRes = await financeiroService.getAll({
            licencaId: licenca.id,
            size: 1,
          });
          // Check if content array has items, not just totalElements
          const hasTitulos =
            titulosRes && titulosRes.content && titulosRes.content.length > 0;
          setTemTitulos(hasTitulos);
        } catch (error) {
          console.error("Erro ao verificar títulos:", error);
          setTemTitulos(false);
        }
      } else {
        setLicencaEditando(null);
        const hoje = new Date();
        const anoQueVem = new Date();
        anoQueVem.setFullYear(hoje.getFullYear() + 1);

        setFormData({
          clienteId: clienteIdParam || "",
          status: "ATIVO",
          dataInicio: hoje.toISOString().split("T")[0],
          dataExpiracao: anoQueVem.toISOString().split("T")[0],
          limiteUsuarios: null,
          limiteDispositivos: null,
          tipoControle: "USUARIO",
          usuarioPrincipalId: null,
        });
        setUsuariosCliente([]);
      }
      clearError();
      setModalOpen(true);
    },
    [clienteIdParam, clearError]
  );

  // Efeito para tratar o parâmetro ID da URL após o carregamento dos dados
  useEffect(() => {
    const idParam = queryParams.get("id");
    if (idParam && licencas.length > 0) {
      const licencaEncontrada = licencas.find((l) => l.id === idParam);
      if (licencaEncontrada) {
        handleOpenModal(licencaEncontrada);
        // Limpa o parâmetro da URL para não reabrir ao atualizar
        navigate("/licencas", { replace: true });
      }
    }
  }, [licencas, queryParams, navigate, handleOpenModal]);

  // Efeito para carregar usuários quando o cliente muda no formulário
  useEffect(() => {
    const carregarUsuarios = async () => {
      if (formData.clienteId && modalOpen) {
        try {
          setIsCarregandoUsuarios(true);
          const res = await usuarioService.getByCliente(formData.clienteId);
          setUsuariosCliente(Array.isArray(res) ? res : res?.content || []);
        } catch (error) {
          console.error("Erro ao carregar usuários do cliente:", error);
        } finally {
          setIsCarregandoUsuarios(false);
        }
      }
    };
    carregarUsuarios();
  }, [formData.clienteId, modalOpen]);

  const handleSalvar = async () => {
    try {
      if (!formData.clienteId || !formData.produtoId || !formData.planoId) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha cliente, produto e plano.",
          variant: "destructive",
        });
        return;
      }

      if (licencaEditando) {
        const updatePayload: UpdateLicencaDTO = {
          status: formData.status,
          dataExpiracao: new Date(formData.dataExpiracao!).toISOString(),
          limiteUsuarios: formData.limiteUsuarios,
          limiteDispositivos: formData.limiteDispositivos,
          usuarioPrincipalId: formData.usuarioPrincipalId,
        };
        await licencaService.update(licencaEditando.id, updatePayload);
        toast({ title: "Sucesso", description: "Licença atualizada." });
      } else {
        const createPayload: CreateLicencaDTO = {
          clienteId: formData.clienteId!,
          produtoId: formData.produtoId!,
          planoId: formData.planoId!,
          dataInicio: new Date(formData.dataInicio!).toISOString(),
          dataExpiracao: new Date(formData.dataExpiracao!).toISOString(),
          limiteUsuarios: formData.limiteUsuarios,
          limiteDispositivos: formData.limiteDispositivos,
          tipoControle: formData.tipoControle!,
          usuarioPrincipalId: formData.usuarioPrincipalId,
        };
        const novaLicenca = await licencaService.create(createPayload);

        // Se houver usuário principal, criar o vínculo com a licença
        if (formData.usuarioPrincipalId) {
          try {
            await usuarioService.addVinculo(formData.usuarioPrincipalId, {
              clienteId: formData.clienteId!,
              licencaId: novaLicenca.id,
              role: "OPERADOR",
            });
          } catch (err) {
            console.error("Erro ao criar vínculo de licença:", err);
          }
        }

        toast({ title: "Sucesso", description: "Licença criada." });
      }

      setModalOpen(false);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível salvar a licença.");
    }
  };

  const handleOpenDispositivos = async (licenca: Licenca) => {
    setLicencaDispositivos(licenca);
    setDispositivosModalOpen(true);
    setIsCarregandoDispositivos(true);
    try {
      const response = await dispositivoService.getByLicenca(licenca.id, {
        size: 100,
      });
      setDispositivos(response.content);
    } catch (error) {
      handleError(error, "Erro ao carregar dispositivos.");
    } finally {
      setIsCarregandoDispositivos(false);
    }
  };

  const handleBloquearDispositivo = async (id: string) => {
    try {
      await dispositivoService.bloquear(id);
      toast({ title: "Sucesso", description: "Dispositivo bloqueado." });
      if (licencaDispositivos) handleOpenDispositivos(licencaDispositivos);
      loadData();
    } catch (error) {
      handleError(error, "Erro ao bloquear dispositivo.");
    }
  };

  const handleDesbloquearDispositivo = async (id: string) => {
    try {
      await dispositivoService.desbloquear(id);
      toast({ title: "Sucesso", description: "Dispositivo desbloqueado." });
      if (licencaDispositivos) handleOpenDispositivos(licencaDispositivos);
      loadData();
    } catch (error) {
      handleError(error, "Erro ao desbloquear dispositivo.");
    }
  };

  const handleDeleteDispositivo = (id: string) => {
    setConfirmModal({
      open: true,
      title: "Remover Dispositivo",
      description:
        "Deseja realmente remover este dispositivo? O acesso será revogado imediatamente.",
      onConfirm: async () => {
        try {
          await dispositivoService.delete(id);
          toast({ title: "Sucesso", description: "Dispositivo removido." });
          if (licencaDispositivos) handleOpenDispositivos(licencaDispositivos);
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Erro ao remover dispositivo.");
        }
      },
    });
  };

  const handleRenovar = async () => {
    if (!licencaRenovando) return;
    try {
      await licencaService.renovar(licencaRenovando.id, {
        meses: mesesRenovacao,
      });
      toast({ title: "Sucesso", description: "Licença renovada." });
      setRenovarModalOpen(false);
      loadData();
    } catch (error) {
      handleError(error, "Erro ao renovar licença.");
    }
  };

  const handleSuspender = (licenca: Licenca) => {
    setConfirmModal({
      open: true,
      title: "Suspender Licença",
      description: `Deseja suspender a licença de "${licenca.clienteNome}" para o produto "${licenca.produtoNome}"?`,
      onConfirm: async () => {
        try {
          await licencaService.suspender(licenca.id);
          toast({ title: "Sucesso", description: "Licença suspensa." });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Erro ao suspender licença.");
        }
      },
    });
  };

  const columns: Column<Licenca>[] = [
    {
      key: "clienteCodigoCrm",
      header: "CRM",
      cell: (licenca) => (
        <Badge
          variant="outline"
          className="font-mono text-[10px] px-1.5 py-0 h-5 border-primary/30 text-primary bg-primary/5"
        >
          {licenca.clienteCodigoCrm}
        </Badge>
      ),
      className: "w-[100px]",
    },
    {
      key: "clienteNome",
      header: "Cliente / Empresa",
      cell: (licenca) => (
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <Link
              to={`/clientes?id=${licenca.clienteId}`}
              className="font-medium hover:text-primary transition-colors"
            >
              {licenca.clienteNome}
            </Link>
            <p className="text-[10px] text-muted-foreground font-mono">
              {licenca.chave.substring(0, 16)}...
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "produtoNome",
      header: "Produto / Plano",
      cell: (licenca) => (
        <div className="flex items-center gap-3">
          <ProdutoLogo
            produtoId={licenca.produtoId}
            produtoNome={licenca.produtoNome}
            planoNome={licenca.planoNome}
            className="h-9 w-9"
            showTooltip
          />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold leading-none">
              {licenca.produtoNome}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {licenca.planoNome}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (licenca) => (
        <StatusBadge
          status={licenca.status}
          variant={getStatusVariant(licenca.status)}
        />
      ),
    },
    {
      key: "dataExpiracao",
      header: "Validade",
      cell: (licenca) => {
        const exp = new Date(licenca.dataExpiracao);
        const hoje = new Date();
        const diff = exp.getTime() - hoje.getTime();
        const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));

        return (
          <div className="space-y-1">
            <p className="text-sm">{exp.toLocaleDateString("pt-BR")}</p>
            <p
              className={`text-[10px] ${
                dias < 30
                  ? "text-destructive font-bold"
                  : "text-muted-foreground"
              }`}
            >
              {dias < 0 ? "Expirada" : `${dias} dias restantes`}
            </p>
          </div>
        );
      },
    },
    {
      key: "usoLimite",
      header: "Uso / Limite",
      cell: (licenca) => {
        const isDispositivo =
          licenca.tipoControle === "DISPOSITIVO" ||
          (licenca.tipoControle as string) === "POR_DISPOSITIVO" ||
          licenca.tipoCobranca === "POR_DISPOSITIVO";

        let Icon = isDispositivo ? Smartphone : Users;

        // Se for dispositivo, refinar o ícone com base no produto/tag
        if (isDispositivo) {
          const produtoNome = licenca.produtoNome?.toLowerCase() || "";
          const tagProduto = licenca.tagProduto?.toLowerCase() || "";

          if (
            produtoNome.includes("desktop") ||
            produtoNome.includes("pc") ||
            produtoNome.includes("windows") ||
            tagProduto.includes("desktop")
          ) {
            Icon = Monitor;
          } else if (
            produtoNome.includes("tablet") ||
            tagProduto.includes("tablet")
          ) {
            Icon = Tablet;
          }
        }
        const atual = isDispositivo
          ? licenca.dispositivosAtivos
          : licenca.usuariosAtivos;
        const limite = isDispositivo
          ? licenca.limiteDispositivos
          : licenca.limiteUsuarios;

        return (
          <div className="flex items-center gap-2">
            <Icon className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm">
              {atual || 0} / {limite || "∞"}
            </span>
          </div>
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
      label: "Dispositivos",
      onClick: (licenca) => handleOpenDispositivos(licenca),
      icon: Smartphone,
      hide: (licenca) =>
        licenca.tipoControle !== "DISPOSITIVO" &&
        (licenca.tipoControle as string) !== "POR_DISPOSITIVO" &&
        licenca.tipoCobranca !== "POR_DISPOSITIVO",
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
        description="Gestão de acessos e produtos por cliente"
        icon={Key}
        action={{
          label: "Nova Licença",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Select value={filtroStatus} onValueChange={setFiltroStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos Status</SelectItem>
              <SelectItem value="ATIVO">Ativo</SelectItem>
              <SelectItem value="SUSPENSO">Suspenso</SelectItem>
              <SelectItem value="TRIAL">Trial</SelectItem>
              <SelectItem value="CANCELADO">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filtroProduto} onValueChange={setFiltroProduto}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Produto" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="TODOS">Todos Produtos</SelectItem>
              {produtos.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setMostrarFiltros(!mostrarFiltros)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Mais Filtros
        </Button>
      </div>

      {mostrarFiltros && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Select value={filtroCliente} onValueChange={setFiltroCliente}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TODOS">Todos Clientes</SelectItem>
                    {clientes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setFiltroCliente("TODOS");
                    setFiltroProduto("TODOS");
                    setFiltroStatus("TODOS");
                  }}
                >
                  Limpar Filtros
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <DataTable
        data={licencas}
        columns={columns}
        actions={actions}
        searchKey={["clienteNome", "clienteCodigoCrm", "chave", "produtoNome"]}
        searchPlaceholder="Buscar por cliente, CRM, chave ou produto..."
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
                ? "Ajuste os limites e validade da licença."
                : "Associe um produto a um cliente."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {temTitulos && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-3 items-start">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700">
                  Esta licença possui títulos financeiros. Alguns campos estão
                  bloqueados para manter a integridade.
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={formData.clienteId}
                onValueChange={(v) =>
                  setFormData({ ...formData, clienteId: v })
                }
                disabled={!!licencaEditando || temTitulos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Produto</Label>
                <Select
                  value={formData.produtoId}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      produtoId: v,
                      planoId: undefined,
                    })
                  }
                  disabled={!!licencaEditando || temTitulos}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
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
                <Select
                  value={formData.planoId}
                  onValueChange={(v) => {
                    const plano = planos.find((p) => p.id === v);
                    setFormData({
                      ...formData,
                      planoId: v,
                      limiteUsuarios: plano?.limiteUsuarios ?? null,
                      limiteDispositivos: plano?.limiteDispositivos ?? null,
                      tipoControle:
                        plano?.tipoCobranca === "POR_DISPOSITIVO"
                          ? "DISPOSITIVO"
                          : "USUARIO",
                    });
                  }}
                  disabled={
                    !!licencaEditando || temTitulos || !formData.produtoId
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {planos
                      .filter((p) => p.produtoId === formData.produtoId)
                      .map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nome}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.dataInicio}
                  onChange={(e) =>
                    setFormData({ ...formData, dataInicio: e.target.value })
                  }
                  disabled={!!licencaEditando || temTitulos}
                />
              </div>
              <div className="space-y-2">
                <Label>Data Expiração</Label>
                <Input
                  type="date"
                  value={formData.dataExpiracao}
                  onChange={(e) =>
                    setFormData({ ...formData, dataExpiracao: e.target.value })
                  }
                  disabled={temTitulos}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Controle por</Label>
                <Select
                  value={formData.tipoControle}
                  onValueChange={(v: "USUARIO" | "DISPOSITIVO") =>
                    setFormData({ ...formData, tipoControle: v })
                  }
                  disabled={!!licencaEditando || temTitulos}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USUARIO">Usuários</SelectItem>
                    <SelectItem value="DISPOSITIVO">Dispositivos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  {formData.tipoControle === "USUARIO"
                    ? "Limite de Usuários"
                    : "Limite de Dispositivos"}
                </Label>
                <Input
                  type="number"
                  value={
                    (formData.tipoControle === "USUARIO"
                      ? formData.limiteUsuarios
                      : formData.limiteDispositivos) || ""
                  }
                  onChange={(e) => {
                    const val = e.target.value
                      ? parseInt(e.target.value)
                      : null;
                    if (formData.tipoControle === "USUARIO") {
                      setFormData({
                        ...formData,
                        limiteUsuarios: val,
                        limiteDispositivos: null,
                      });
                    } else {
                      setFormData({
                        ...formData,
                        limiteDispositivos: val,
                        limiteUsuarios: null,
                      });
                    }
                  }}
                  placeholder="Ilimitado se vazio"
                  disabled={temTitulos}
                />
              </div>
            </div>

            {(formData.tipoControle === "DISPOSITIVO" ||
              (formData.tipoControle as string) === "POR_DISPOSITIVO" ||
              (licencaEditando &&
                licencaEditando.tipoControle === "DISPOSITIVO")) && (
              <div className="space-y-2">
                <Label>Usuário Principal (Validação de Dispositivos)</Label>
                <Select
                  value={formData.usuarioPrincipalId || "NENHUM"}
                  onValueChange={(v) =>
                    setFormData({
                      ...formData,
                      usuarioPrincipalId: v === "NENHUM" ? null : v,
                    })
                  }
                  disabled={isCarregandoUsuarios}
                >
                  <SelectTrigger>
                    <SelectValue
                      placeholder={
                        isCarregandoUsuarios
                          ? "Carregando usuários..."
                          : "Selecione o usuário principal"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NENHUM">Nenhum (Manual)</SelectItem>
                    {Array.isArray(usuariosCliente) &&
                      usuariosCliente.map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.nome} ({u.email})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground italic">
                  * Este usuário será usado para validar o primeiro acesso de
                  novos dispositivos.
                </p>
              </div>
            )}

            {licencaEditando && (
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) =>
                    setFormData({ ...formData, status: v as Status })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ATIVO">Ativo</SelectItem>
                    <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                    <SelectItem value="TRIAL">Trial</SelectItem>
                    <SelectItem value="CANCELADO">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isLoading}>
              {licencaEditando ? "Salvar Alterações" : "Criar Licença"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Renovação */}
      <Dialog open={renovarModalOpen} onOpenChange={setRenovarModalOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Renovar Licença</DialogTitle>
            <DialogDescription>
              Selecione o período de renovação para{" "}
              {licencaRenovando?.clienteNome}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Período (Meses)</Label>
              <Select
                value={mesesRenovacao.toString()}
                onValueChange={(v) => setMesesRenovacao(parseInt(v))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Mês</SelectItem>
                  <SelectItem value="3">3 Meses</SelectItem>
                  <SelectItem value="6">6 Meses</SelectItem>
                  <SelectItem value="12">12 Meses</SelectItem>
                  <SelectItem value="24">24 Meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenovarModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleRenovar}>Confirmar Renovação</Button>
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

      {/* Modal de Gerenciamento de Dispositivos */}
      <Dialog
        open={dispositivosModalOpen}
        onOpenChange={setDispositivosModalOpen}
      >
        <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="p-6 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 mb-1">
                  <Smartphone className="h-5 w-5 text-primary" />
                  Dispositivos da Licença
                </DialogTitle>
                <DialogDescription>
                  {licencaDispositivos?.clienteNome} -{" "}
                  {licencaDispositivos?.produtoNome}
                </DialogDescription>
              </div>
              <div className="text-right">
                <Badge variant="outline" className="font-mono">
                  {
                    dispositivos.filter(
                      (d) => d.status === StatusDispositivo.ATIVO
                    ).length
                  }{" "}
                  / {licencaDispositivos?.limiteDispositivos || "∞"}
                </Badge>
                <p className="text-[10px] text-muted-foreground uppercase mt-1">
                  Dispositivos Ativos
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col">
            <div className="px-6 py-2 border-b bg-muted/30 flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Dispositivos Registrados
              </span>
            </div>

            <ScrollArea className="flex-1">
              <div className="p-6 space-y-4">
                {isCarregandoDispositivos ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <RefreshCw className="h-8 w-8 text-primary animate-spin" />
                    <p className="text-sm text-muted-foreground">
                      Carregando dispositivos...
                    </p>
                  </div>
                ) : dispositivos.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-2 border-2 border-dashed rounded-xl">
                    <Smartphone className="h-12 w-12 text-muted-foreground/20" />
                    <p className="text-sm text-muted-foreground">
                      Nenhum dispositivo registrado para esta licença.
                    </p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {dispositivos.map((disp) => (
                      <div
                        key={disp.id}
                        className={cn(
                          "group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-200",
                          disp.status === StatusDispositivo.BLOQUEADO
                            ? "bg-destructive/5 border-destructive/20"
                            : "bg-card hover:border-primary/30 hover:shadow-sm"
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={cn(
                              "p-3 rounded-lg",
                              disp.status === StatusDispositivo.BLOQUEADO
                                ? "bg-destructive/10 text-destructive"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            {disp.tipo === TipoDispositivo.COMPUTADOR && (
                              <Monitor className="h-5 w-5" />
                            )}
                            {disp.tipo === TipoDispositivo.CELULAR && (
                              <Smartphone className="h-5 w-5" />
                            )}
                            {disp.tipo === TipoDispositivo.TABLET && (
                              <Tablet className="h-5 w-5" />
                            )}
                            {disp.tipo === TipoDispositivo.OUTRO && (
                              <Package className="h-5 w-5" />
                            )}
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold text-sm">
                                {disp.apelido}
                              </h4>
                              <Badge
                                variant={
                                  disp.status === StatusDispositivo.ATIVO
                                    ? "outline"
                                    : "destructive"
                                }
                                className={cn(
                                  "text-[9px] px-1.5 py-0 h-4 uppercase tracking-wider",
                                  disp.status === StatusDispositivo.ATIVO &&
                                    "border-green-500 text-green-600 bg-green-50"
                                )}
                              >
                                {disp.status}
                              </Badge>
                            </div>
                            <div className="flex flex-col gap-0.5 mt-1">
                              <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
                                <Shield className="h-3 w-3" /> {disp.deviceId}
                              </p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                <Users className="h-3 w-3" /> {disp.usuarioNome}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="text-right mr-4 hidden sm:block">
                            <p className="text-[10px] text-muted-foreground uppercase">
                              Último Acesso
                            </p>
                            <p className="text-xs font-medium">
                              {new Date(disp.ultimoAcesso).toLocaleString(
                                "pt-BR",
                                {
                                  dateStyle: "short",
                                  timeStyle: "short",
                                }
                              )}
                            </p>
                          </div>

                          <TooltipProvider>
                            <div className="flex items-center gap-1">
                              {disp.status === StatusDispositivo.ATIVO ? (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                      onClick={() =>
                                        handleBloquearDispositivo(disp.id)
                                      }
                                    >
                                      <Ban className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Bloquear Dispositivo
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-success hover:bg-success/10"
                                      onClick={() =>
                                        handleDesbloquearDispositivo(disp.id)
                                      }
                                    >
                                      <RefreshCw className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    Desbloquear Dispositivo
                                  </TooltipContent>
                                </Tooltip>
                              )}

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={() =>
                                      handleDeleteDispositivo(disp.id)
                                    }
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Remover Dispositivo
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          </TooltipProvider>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/10">
            <Button
              variant="outline"
              onClick={() => setDispositivosModalOpen(false)}
            >
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
