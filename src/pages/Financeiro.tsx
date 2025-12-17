import { useState } from "react";
import { DollarSign, Plus, FileText, Download } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column, Action } from "@/components/DataTable";
import { StatusBadge, getStatusVariant } from "@/components/StatusBadge";
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

interface TituloFinanceiro {
  id: string;
  numero: string;
  licencaId: string;
  clienteNome: string;
  descricao: string;
  valor: number;
  dataVencimento: string;
  dataPagamento: string | null;
  status: "PENDENTE" | "PAGO" | "EM_ATRASO" | "CANCELADO";
}

const mockTitulos: TituloFinanceiro[] = [
  { id: "1", numero: "FAT-2024-001", licencaId: "1", clienteNome: "Tech Solutions Ltda", descricao: "ERP Cloud - Professional - Mar/2024", valor: 1998.00, dataVencimento: "2024-03-15", dataPagamento: "2024-03-14", status: "PAGO" },
  { id: "2", numero: "FAT-2024-002", licencaId: "2", clienteNome: "João Silva", descricao: "ERP Cloud - Starter - Mar/2024", valor: 249.50, dataVencimento: "2024-03-20", dataPagamento: null, status: "PENDENTE" },
  { id: "3", numero: "FAT-2024-003", licencaId: "3", clienteNome: "Digital Corp", descricao: "API Gateway - Pro - Mar/2024", valor: 850.00, dataVencimento: "2024-03-15", dataPagamento: "2024-03-15", status: "PAGO" },
  { id: "4", numero: "FAT-2024-004", licencaId: "4", clienteNome: "Empresa ABC S.A.", descricao: "ERP Cloud - Enterprise - Fev/2024", valor: 4999.00, dataVencimento: "2024-02-10", dataPagamento: null, status: "EM_ATRASO" },
  { id: "5", numero: "FAT-2024-005", licencaId: "4", clienteNome: "Empresa ABC S.A.", descricao: "ERP Cloud - Enterprise - Mar/2024", valor: 4999.00, dataVencimento: "2024-03-10", dataPagamento: null, status: "EM_ATRASO" },
  { id: "6", numero: "FAT-2024-006", licencaId: "6", clienteNome: "StartupXYZ", descricao: "CRM Plus - Professional - Mar/2024", valor: 599.40, dataVencimento: "2024-03-01", dataPagamento: null, status: "CANCELADO" },
  { id: "7", numero: "FAT-2024-007", licencaId: "1", clienteNome: "Tech Solutions Ltda", descricao: "ERP Cloud - Professional - Abr/2024", valor: 1998.00, dataVencimento: "2024-04-15", dataPagamento: null, status: "PENDENTE" },
  { id: "8", numero: "FAT-2024-008", licencaId: "8", clienteNome: "Mega Systems", descricao: "PDV Desktop - PDV Único - Mar/2024", valor: 149.90, dataVencimento: "2024-03-25", dataPagamento: null, status: "PENDENTE" },
];

export default function Financeiro() {
  const [titulos, setTitulos] = useState<TituloFinanceiro[]>(mockTitulos);
  const [modalAberto, setModalAberto] = useState(false);
  const [tituloEditando, setTituloEditando] = useState<TituloFinanceiro | null>(null);
  const { toast } = useToast();

  // Cálculos para os cards
  const totalReceber = titulos
    .filter(t => t.status === "PENDENTE" || t.status === "EM_ATRASO")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalRecebido = titulos
    .filter(t => t.status === "PAGO")
    .reduce((acc, t) => acc + t.valor, 0);
  const totalAtrasado = titulos
    .filter(t => t.status === "EM_ATRASO")
    .reduce((acc, t) => acc + t.valor, 0);

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
      key: "cliente",
      header: "Cliente",
      cell: (titulo) => (
        <span className="font-medium">{titulo.clienteNome}</span>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      cell: (titulo) => (
        <span className="text-sm text-muted-foreground line-clamp-1">{titulo.descricao}</span>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      cell: (titulo) => (
        <span className="font-medium">
          R$ {titulo.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: "vencimento",
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
        <StatusBadge status={titulo.status} variant={getStatusVariant(titulo.status)} />
      ),
    },
  ];

  const actions: Action<TituloFinanceiro>[] = [
    {
      label: "Registrar pagamento",
      onClick: (titulo) => {
        setTitulos(titulos.map(t =>
          t.id === titulo.id
            ? { ...t, status: "PAGO" as const, dataPagamento: new Date().toISOString().split("T")[0] }
            : t
        ));
        toast({
          title: "Pagamento registrado",
          description: `Título ${titulo.numero} marcado como pago.`,
        });
      },
    },
    {
      label: "Gerar boleto",
      onClick: (titulo) => {
        toast({
          title: "Boleto gerado",
          description: `Boleto do título ${titulo.numero} foi gerado.`,
        });
      },
    },
    {
      label: "Cancelar",
      onClick: (titulo) => {
        setTitulos(titulos.map(t =>
          t.id === titulo.id ? { ...t, status: "CANCELADO" as const } : t
        ));
        toast({
          title: "Título cancelado",
          description: `Título ${titulo.numero} foi cancelado.`,
          variant: "destructive",
        });
      },
      variant: "destructive",
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setTituloEditando(null);
    toast({
      title: "Título criado",
      description: "Operação realizada com sucesso.",
    });
  };

  const titulosFiltrados = (status?: string) => {
    if (!status || status === "todos") return titulos;
    return titulos.filter(t => t.status === status);
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
            setTituloEditando(null);
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
          value={`R$ ${totalReceber.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Títulos pendentes"
        />
        <StatsCard
          title="Recebido (mês)"
          value={`R$ ${totalRecebido.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
          icon={DollarSign}
          description="Pagamentos confirmados"
        />
        <StatsCard
          title="Em Atraso"
          value={`R$ ${totalAtrasado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
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
              <Label htmlFor="cliente">Cliente / Licença</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Tech Solutions - ERP Professional</SelectItem>
                  <SelectItem value="2">João Silva - ERP Starter</SelectItem>
                  <SelectItem value="3">Digital Corp - API Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Input id="descricao" placeholder="Descrição do título" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input id="valor" type="number" step="0.01" placeholder="0.00" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="vencimento">Vencimento</Label>
                <Input id="vencimento" type="date" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              Cadastrar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
