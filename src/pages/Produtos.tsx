import { useState } from "react";
import { Package, Plus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface Produto {
  id: string;
  nome: string;
  descricao: string;
  tipo: "WEB" | "API" | "DESKTOP" | "MOBILE";
  versao: string;
  ativo: boolean;
  criadoEm: string;
}

const mockProdutos: Produto[] = [
  { id: "1", nome: "ERP Cloud", descricao: "Sistema de gestão empresarial completo", tipo: "WEB", versao: "3.2.1", ativo: true, criadoEm: "2023-06-15" },
  { id: "2", nome: "API Gateway", descricao: "Gateway de integração com parceiros", tipo: "API", versao: "2.0.0", ativo: true, criadoEm: "2023-08-20" },
  { id: "3", nome: "PDV Desktop", descricao: "Ponto de venda para lojas físicas", tipo: "DESKTOP", versao: "4.1.0", ativo: true, criadoEm: "2023-03-10" },
  { id: "4", nome: "App Vendas", descricao: "Aplicativo mobile para força de vendas", tipo: "MOBILE", versao: "1.5.2", ativo: true, criadoEm: "2024-01-05" },
  { id: "5", nome: "CRM Plus", descricao: "Gestão de relacionamento com clientes", tipo: "WEB", versao: "2.3.0", ativo: true, criadoEm: "2023-09-12" },
  { id: "6", nome: "BI Analytics", descricao: "Dashboard de análise de dados", tipo: "WEB", versao: "1.0.0", ativo: false, criadoEm: "2024-02-01" },
];

const tipoLabels: Record<string, string> = {
  WEB: "Aplicação Web",
  API: "API/Integração",
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
};

export default function Produtos() {
  const [produtos, setProdutos] = useState<Produto[]>(mockProdutos);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const { toast } = useToast();

  const columns: Column<Produto>[] = [
    {
      key: "nome",
      header: "Produto",
      cell: (produto) => (
        <div>
          <p className="font-medium">{produto.nome}</p>
          <p className="text-xs text-muted-foreground line-clamp-1">{produto.descricao}</p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (produto) => (
        <StatusBadge status={tipoLabels[produto.tipo]} variant="info" />
      ),
    },
    {
      key: "versao",
      header: "Versão",
      cell: (produto) => (
        <span className="font-mono text-sm">{produto.versao}</span>
      ),
    },
    {
      key: "ativo",
      header: "Status",
      cell: (produto) => (
        <StatusBadge
          status={produto.ativo ? "Ativo" : "Inativo"}
          variant={produto.ativo ? "success" : "muted"}
        />
      ),
    },
    {
      key: "criadoEm",
      header: "Criado em",
      cell: (produto) => (
        <span className="text-sm text-muted-foreground">
          {new Date(produto.criadoEm).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const actions: Action<Produto>[] = [
    {
      label: "Editar",
      onClick: (produto) => {
        setProdutoEditando(produto);
        setModalAberto(true);
      },
    },
    {
      label: "Ver planos",
      onClick: (produto) => {
        toast({
          title: "Planos",
          description: `Visualizando planos de ${produto.nome}`,
        });
      },
    },
    {
      label: "Excluir",
      onClick: (produto) => {
        setProdutos(produtos.filter((p) => p.id !== produto.id));
        toast({
          title: "Produto excluído",
          description: `${produto.nome} foi removido com sucesso.`,
        });
      },
      variant: "destructive",
    },
  ];

  const handleSalvar = () => {
    setModalAberto(false);
    setProdutoEditando(null);
    toast({
      title: produtoEditando ? "Produto atualizado" : "Produto criado",
      description: "Operação realizada com sucesso.",
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Produtos"
        description="Gerencie os produtos SaaS disponíveis"
        icon={Package}
        action={{
          label: "Novo Produto",
          onClick: () => {
            setProdutoEditando(null);
            setModalAberto(true);
          },
          icon: Plus,
        }}
      />

      <DataTable
        data={produtos}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{produtoEditando ? "Editar Produto" : "Novo Produto"}</DialogTitle>
            <DialogDescription>
              {produtoEditando ? "Atualize as informações do produto" : "Preencha os dados para cadastrar um novo produto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" defaultValue={produtoEditando?.nome} placeholder="Nome do produto" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea id="descricao" defaultValue={produtoEditando?.descricao} placeholder="Descrição do produto" rows={3} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tipo">Tipo</Label>
                <Select defaultValue={produtoEditando?.tipo || "WEB"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEB">Aplicação Web</SelectItem>
                    <SelectItem value="API">API/Integração</SelectItem>
                    <SelectItem value="DESKTOP">Desktop</SelectItem>
                    <SelectItem value="MOBILE">Mobile</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="versao">Versão</Label>
                <Input id="versao" defaultValue={produtoEditando?.versao} placeholder="1.0.0" />
              </div>
            </div>

            {produtoEditando && (
              <div className="space-y-2">
                <Label htmlFor="ativo">Status</Label>
                <Select defaultValue={produtoEditando.ativo ? "true" : "false"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Ativo</SelectItem>
                    <SelectItem value="false">Inativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar}>
              {produtoEditando ? "Salvar" : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
