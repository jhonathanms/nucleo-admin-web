import { useState } from "react";
import { CreditCard, Plus } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Plano {
  id: string;
  nome: string;
  descricao: string;
  produtoId: string;
  produtoNome: string;
  tipoCobranca: "USUARIO" | "RECURSO" | "VOLUME" | "FIXO";
  valor: number;
  limiteUsuarios: number | null;
  trial: boolean;
  diasTrial: number;
  ativo: boolean;
}

const mockPlanos: Plano[] = [
  { id: "1", nome: "Starter", descricao: "Ideal para pequenas empresas", produtoId: "1", produtoNome: "ERP Cloud", tipoCobranca: "USUARIO", valor: 49.90, limiteUsuarios: 5, trial: true, diasTrial: 14, ativo: true },
  { id: "2", nome: "Professional", descricao: "Para empresas em crescimento", produtoId: "1", produtoNome: "ERP Cloud", tipoCobranca: "USUARIO", valor: 99.90, limiteUsuarios: 20, trial: true, diasTrial: 14, ativo: true },
  { id: "3", nome: "Enterprise", descricao: "Recursos ilimitados para grandes empresas", produtoId: "1", produtoNome: "ERP Cloud", tipoCobranca: "FIXO", valor: 499.90, limiteUsuarios: null, trial: false, diasTrial: 0, ativo: true },
  { id: "4", nome: "Basic", descricao: "Acesso básico à API", produtoId: "2", produtoNome: "API Gateway", tipoCobranca: "VOLUME", valor: 0.01, limiteUsuarios: null, trial: true, diasTrial: 30, ativo: true },
  { id: "5", nome: "Pro", descricao: "Alto volume de requisições", produtoId: "2", produtoNome: "API Gateway", tipoCobranca: "VOLUME", valor: 0.005, limiteUsuarios: null, trial: false, diasTrial: 0, ativo: true },
  { id: "6", nome: "PDV Único", descricao: "Licença para um caixa", produtoId: "3", produtoNome: "PDV Desktop", tipoCobranca: "FIXO", valor: 149.90, limiteUsuarios: 3, trial: true, diasTrial: 7, ativo: true },
];

const tipoCobrancaLabels: Record<string, string> = {
  USUARIO: "Por usuário",
  RECURSO: "Por recurso",
  VOLUME: "Por volume",
  FIXO: "Valor fixo",
};

export default function Planos() {
  const [planos, setPlanos] = useState<Plano[]>(mockPlanos);
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const { toast } = useToast();

  const columns: Column<Plano>[] = [
    {
      key: "nome",
      header: "Plano",
      cell: (plano) => (
        <div>
          <p className="font-medium">{plano.nome}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{plano.descricao}</p>
        </div>
      ),
    },
    {
      key: "produto",
      header: "Produto",
      cell: (plano) => (
        <span className="text-sm">{plano.produtoNome}</span>
      ),
    },
    {
      key: "tipoCobranca",
      header: "Cobrança",
      cell: (plano) => (
        <span className="text-sm">{tipoCobrancaLabels[plano.tipoCobranca]}</span>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      cell: (plano) => (
        <span className="font-medium">
          {plano.tipoCobranca === "VOLUME"
            ? `R$ ${plano.valor.toFixed(3)}/req`
            : `R$ ${plano.valor.toFixed(2)}/mês`}
        </span>
      ),
    },
    {
      key: "limites",
      header: "Limites",
      cell: (plano) => (
        <span className="text-sm text-muted-foreground">
          {plano.limiteUsuarios ? `${plano.limiteUsuarios} usuários` : "Ilimitado"}
        </span>
      ),
    },
    {
      key: "trial",
      header: "Trial",
      cell: (plano) => (
        plano.trial ? (
          <StatusBadge status={`${plano.diasTrial} dias`} variant="info" />
        ) : (
          <span className="text-sm text-muted-foreground">—</span>
        )
      ),
    },
    {
      key: "ativo",
      header: "Status",
      cell: (plano) => (
        <StatusBadge
          status={plano.ativo ? "Ativo" : "Inativo"}
          variant={plano.ativo ? "success" : "muted"}
        />
      ),
    },
  ];

  const actions: Action<Plano>[] = [
    {
      label: "Editar",
      onClick: (plano) => {
        setPlanoEditando(plano);
        setModalAberto(true);
      },
    },
    {
      label: "Duplicar",
      onClick: (plano) => {
        toast({
          title: "Plano duplicado",
          description: `Cópia de ${plano.nome} criada.`,
        });
      },
    },
    {
      label: "Excluir",
      onClick: (plano) => {
        setPlanos(planos.filter((p) => p.id !== plano.id));
        toast({
          title: "Plano excluído",
          description: `${plano.nome} foi removido com sucesso.`,
        });
      },
      variant: "destructive",
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setPlanoEditando(null);
    toast({
      title: planoEditando ? "Plano atualizado" : "Plano criado",
      description: "Operação realizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Planos"
        description="Configure os planos de assinatura"
        icon={CreditCard}
        action={{
          label: "Novo Plano",
          onClick: () => {
            setPlanoEditando(null);
            setModalAberto(true);
          },
          icon: Plus,
        }}
      />

      <DataTable
        data={planos}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{planoEditando ? "Editar Plano" : "Novo Plano"}</DialogTitle>
            <DialogDescription>
              {planoEditando ? "Atualize as informações do plano" : "Configure um novo plano de assinatura"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" defaultValue={planoEditando?.nome} placeholder="Nome do plano" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="produto">Produto</Label>
                <Select defaultValue={planoEditando?.produtoId || "1"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Produto" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">ERP Cloud</SelectItem>
                    <SelectItem value="2">API Gateway</SelectItem>
                    <SelectItem value="3">PDV Desktop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" defaultValue={planoEditando?.descricao} placeholder="Descrição do plano" rows={2} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                <Select defaultValue={planoEditando?.tipoCobranca || "FIXO"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USUARIO">Por usuário</SelectItem>
                    <SelectItem value="RECURSO">Por recurso</SelectItem>
                    <SelectItem value="VOLUME">Por volume</SelectItem>
                    <SelectItem value="FIXO">Valor fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="valor">Valor (R$)</Label>
                <Input id="valor" type="number" step="0.01" defaultValue={planoEditando?.valor} placeholder="0.00" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="limiteUsuarios">Limite de Usuários</Label>
              <Input id="limiteUsuarios" type="number" defaultValue={planoEditando?.limiteUsuarios || ""} placeholder="Deixe vazio para ilimitado" />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <Label htmlFor="trial">Período Trial</Label>
                <p className="text-sm text-muted-foreground">Permitir avaliação gratuita</p>
              </div>
              <Switch id="trial" defaultChecked={planoEditando?.trial} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="diasTrial">Dias de Trial</Label>
              <Input id="diasTrial" type="number" defaultValue={planoEditando?.diasTrial || 14} placeholder="14" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {planoEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
