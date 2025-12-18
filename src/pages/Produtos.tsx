import { useState, useEffect } from "react";
import { Package, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import produtoService from "@/services/produto.service";
import {
  Produto,
  CreateProdutoDTO,
  UpdateProdutoDTO,
  ProdutoTipo,
} from "@/types/produto.types";

export default function Produtos() {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [produtoEditando, setProdutoEditando] = useState<Produto | null>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState<Partial<Produto>>({
    tipo: "WEB",
    ativo: true,
  });

  const loadProdutos = async () => {
    setIsLoading(true);
    try {
      const response = await produtoService.getAll({ size: 100 });
      setProdutos(response.content);
    } catch (error) {
      console.error("Erro ao carregar produtos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a lista de produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProdutos();
  }, []);

  const handleOpenModal = (produto?: Produto) => {
    if (produto) {
      setProdutoEditando(produto);
      setFormData({
        nome: produto.nome,
        descricao: produto.descricao,
        tipo: produto.tipo,
        versao: produto.versao,
        ativo: produto.ativo,
      });
    } else {
      setProdutoEditando(null);
      setFormData({
        tipo: "WEB",
        ativo: true,
      });
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!formData.nome || !formData.versao) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome e versão.",
          variant: "destructive",
        });
        return;
      }

      if (produtoEditando) {
        await produtoService.update(
          produtoEditando.id,
          formData as UpdateProdutoDTO
        );
        toast({
          title: "Sucesso",
          description: "Produto atualizado com sucesso.",
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ativo, ...createData } = formData;
        await produtoService.create(createData as CreateProdutoDTO);
        toast({ title: "Sucesso", description: "Produto criado com sucesso." });
      }

      setModalAberto(false);
      loadProdutos();
    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o produto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (produto: Produto) => {
    if (!confirm(`Tem certeza que deseja excluir ${produto.nome}?`)) return;

    try {
      await produtoService.delete(produto.id);
      toast({ title: "Sucesso", description: "Produto excluído com sucesso." });
      loadProdutos();
    } catch (error) {
      console.error("Erro ao excluir produto:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o produto.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Produto>[] = [
    {
      key: "nome",
      header: "Produto",
      cell: (produto) => (
        <div>
          <p className="font-medium">{produto.nome}</p>
          <p className="text-xs text-muted-foreground">{produto.descricao}</p>
        </div>
      ),
    },
    {
      key: "tipo",
      header: "Tipo",
      cell: (produto) => <span className="text-sm">{produto.tipo}</span>,
    },
    {
      key: "versao",
      header: "Versão",
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
      onClick: (produto) => handleOpenModal(produto),
    },
    {
      label: "Ver planos",
      onClick: (produto) => {
        navigate(`/planos?produtoId=${produto.id}`);
        toast({
          title: "Filtro aplicado",
          description: `Visualizando planos de ${produto.nome}`,
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
        title="Produtos"
        description="Gerencie o catálogo de produtos"
        icon={Package}
        action={{
          label: "Novo Produto",
          onClick: () => handleOpenModal(),
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
            <DialogTitle>
              {produtoEditando ? "Editar Produto" : "Novo Produto"}
            </DialogTitle>
            <DialogDescription>
              {produtoEditando
                ? "Atualize as informações do produto"
                : "Preencha os dados para cadastrar um novo produto"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value: ProdutoTipo) =>
                  setFormData({ ...formData, tipo: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="WEB">Web Application</SelectItem>
                  <SelectItem value="API">API Service</SelectItem>
                  <SelectItem value="DESKTOP">Desktop App</SelectItem>
                  <SelectItem value="MOBILE">Mobile App</SelectItem>
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
                placeholder="Nome do produto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="versao">Versão Atual</Label>
              <Input
                id="versao"
                value={formData.versao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, versao: e.target.value })
                }
                placeholder="v1.0.0"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Breve descrição do produto"
              />
            </div>

            {produtoEditando && (
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.ativo ? "true" : "false"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, ativo: value === "true" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o status" />
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
            <Button onClick={handleSalvar} disabled={isLoading}>
              {isLoading
                ? "Salvando..."
                : produtoEditando
                ? "Salvar"
                : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
