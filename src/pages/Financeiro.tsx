import { useState, useEffect } from "react";
import {
  DollarSign,
  Plus,
  FileText,
  Download,
  Ban,
  CheckCircle,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { StatsCard } from "@/components/StatsCard";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import financeiroService from "@/services/financeiro.service";
import licencaService from "@/services/licenca.service";
import {
  TituloFinanceiro,
  CreateTituloDTO,
  StatusTitulo,
} from "@/types/financeiro.types";
import { Licenca } from "@/types/licenca.types";

export default function Financeiro() {
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<CreateTituloDTO>>({});

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [titulosRes, licencasRes] = await Promise.all([
        financeiroService.getAll({ size: 100 }),
        licencaService.getAll({ size: 100 }),
      ]);
      setTitulos(titulosRes.content);
      setLicencas(licencasRes.content);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados financeiros.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cálculos para os cards
  const totalReceber = titulos
    .filter((t) => t.status === "PENDENTE" || t.status === "EM_ATRASO")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalRecebido = titulos
    .filter((t) => t.status === "PAGO")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalAtrasado = titulos
    .filter((t) => t.status === "EM_ATRASO")
    .reduce((acc, t) => acc + t.valor, 0);

  const handleSalvar = async () => {
    try {
      if (
        !formData.licencaId ||
        !formData.descricao ||
        !formData.valor ||
        !formData.dataVencimento
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha todos os campos.",
          variant: "destructive",
        });
        return;
      }

      await financeiroService.create(formData as CreateTituloDTO);
      toast({ title: "Sucesso", description: "Título criado com sucesso." });
      setModalAberto(false);
      loadData();
    } catch (error) {
      console.error("Erro ao criar título:", error);
      toast({
        title: "Erro",
        description: "Não foi possível criar o título.",
        variant: "destructive",
      });
    }
  };

  const handleRegistrarPagamento = async (titulo: TituloFinanceiro) => {
    try {
      await financeiroService.registrarPagamento(titulo.id);
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso.",
      });
      loadData();
    } catch (error) {
      console.error("Erro ao registrar pagamento:", error);
      toast({
        title: "Erro",
        description: "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    }
  };

  const handleCancelar = async (titulo: TituloFinanceiro) => {
    if (!confirm(`Tem certeza que deseja cancelar o título ${titulo.numero}?`))
      return;

    try {
      await financeiroService.cancelar(titulo.id);
      toast({ title: "Sucesso", description: "Título cancelado com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao cancelar título:", error);
      toast({
        title: "Erro",
        description: "Não foi possível cancelar o título.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: StatusTitulo) => {
    switch (status) {
      case "PAGO":
        return "success";
      case "PENDENTE":
        return "warning";
      case "EM_ATRASO":
        return "destructive";
      case "CANCELADO":
        return "muted";
      default:
        return "default";
    }
  };

  const columns: Column<TituloFinanceiro>[] = [
    {
      key: "numero",
      header: "Número",
      cell: (titulo) => (
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="font-mono text-sm">{titulo.numero}</span>
        </div>
      ),
    },
    {
      key: "clienteNome",
      header: "Cliente",
      cell: (titulo) => (
        <span className="font-medium">{titulo.clienteNome}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      cell: (titulo) => (
        <span className="text-sm text-muted-foreground line-clamp-1">
          {titulo.descricao}
        </span>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      cell: (titulo) => (
        <span className="font-medium">
          R${" "}
          {titulo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "dataVencimento",
      header: "Vencimento",
      cell: (titulo) => (
        <span className="text-sm">
          {new Date(titulo.dataVencimento).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      cell: (titulo) => (
        <StatusBadge
          status={titulo.status}
          variant={getStatusBadgeVariant(titulo.status)}
        />
      ),
    },
  ];

  const actions: Action<TituloFinanceiro>[] = [
    {
      label: "Registrar pagamento",
      onClick: handleRegistrarPagamento,
      icon: CheckCircle,
    },
    {
      label: "Cancelar",
      onClick: handleCancelar,
      variant: "destructive",
      icon: Ban,
    },
  ];

  const titulosFiltrados = (status?: string) => {
    if (!status || status === "todos") return titulos;
    return titulos.filter((t) => t.status === status);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Controle de cobranças e títulos"
        icon={DollarSign}
        action={{
          label: "Novo Título",
          onClick: () => {
            setFormData({});
            setModalAberto(true);
          },
          icon: Plus,
        }}
      >
        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </PageHeader>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="A Receber"
          value={`R$ ${totalReceber.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Títulos pendentes"
        />
        <StatsCard
          title="Recebido (mês)"
          value={`R$ ${totalRecebido.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Pagamentos confirmados"
        />
        <StatsCard
          title="Em Atraso"
          value={`R$ ${totalAtrasado.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })}`}
          icon={DollarSign}
          description="Títulos vencidos"
        />
      </div>

      {/* Tabs com filtros */}
      <Tabs defaultValue="todos" className="space-y-4">
        <TabsList>
          <TabsTrigger value="todos">Todos</TabsTrigger>
          <TabsTrigger value="PENDENTE">Pendentes</TabsTrigger>
          <TabsTrigger value="PAGO">Pagos</TabsTrigger>
          <TabsTrigger value="EM_ATRASO">Em Atraso</TabsTrigger>
        </TabsList>

        <TabsContent value="todos">
          <DataTable
            data={titulos}
            columns={columns}
            actions={actions}
            searchKey="clienteNome"
            searchPlaceholder="Buscar por cliente..."
          />
        </TabsContent>

        <TabsContent value="PENDENTE">
          <DataTable
            data={titulosFiltrados("PENDENTE")}
            columns={columns}
            actions={actions}
            searchKey="clienteNome"
            searchPlaceholder="Buscar por cliente..."
          />
        </TabsContent>

        <TabsContent value="PAGO">
          <DataTable
            data={titulosFiltrados("PAGO")}
            columns={columns}
            actions={actions}
            searchKey="clienteNome"
            searchPlaceholder="Buscar por cliente..."
          />
        </TabsContent>

        <TabsContent value="EM_ATRASO">
          <DataTable
            data={titulosFiltrados("EM_ATRASO")}
            columns={columns}
            actions={actions}
            searchKey="clienteNome"
            searchPlaceholder="Buscar por cliente..."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Título</DialogTitle>
            <DialogDescription>
              Crie um novo título financeiro
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="licenca">Licença / Cliente</Label>
              <Select
                value={formData.licencaId}
                onValueChange={(value) =>
                  setFormData({ ...formData, licencaId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a licença" />
                </SelectTrigger>
                <SelectContent>
                  {licencas.map((l) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.clienteNome} - {l.produtoNome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição do título"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input
                  id="valor"
                  type="number"
                  step="0.01"
                  value={formData.valor || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      valor: parseFloat(e.target.value),
                    })
                  }
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vencimento">Vencimento</Label>
                <Input
                  id="vencimento"
                  type="date"
                  value={formData.dataVencimento || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dataVencimento: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isLoading}>
              {isLoading ? "Salvando..." : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
