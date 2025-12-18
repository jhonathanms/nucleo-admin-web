import { useState, useEffect } from "react";
import { CreditCard, Plus, Copy } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import planoService from "@/services/plano.service";
import produtoService from "@/services/produto.service";
import {
  Plano,
  CreatePlanoDTO,
  UpdatePlanoDTO,
  TipoCobranca,
} from "@/types/plano.types";
import { Produto } from "@/types/produto.types";

export default function Planos() {
  const [planos, setPlanos] = useState<Plano[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const { toast } = useToast();

  // Local state for form fields
  const [formData, setFormData] = useState<Partial<Plano>>({
    tipoCobranca: "FIXO",
    trial: false,
    diasTrial: 0,
    ativo: true,
    recursos: [],
  });

  // Helper state for comma-separated resources input
  const [recursosInput, setRecursosInput] = useState("");

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [planosRes, produtosRes] = await Promise.all([
        planoService.getAll({ size: 100 }),
        produtoService.getAll({ size: 100 }),
      ]);
      setPlanos(planosRes.content);
      setProdutos(produtosRes.content);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar planos ou produtos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenModal = (plano?: Plano) => {
    if (plano) {
      setPlanoEditando(plano);
      setFormData({
        nome: plano.nome,
        descricao: plano.descricao,
        produtoId: plano.produtoId,
        tipoCobranca: plano.tipoCobranca,
        valor: plano.valor,
        limiteUsuarios: plano.limiteUsuarios,
        trial: plano.trial,
        diasTrial: plano.diasTrial,
        ativo: plano.ativo,
        recursos: plano.recursos,
      });
      setRecursosInput(plano.recursos ? plano.recursos.join(", ") : "");
    } else {
      setPlanoEditando(null);
      setFormData({
        tipoCobranca: "FIXO",
        trial: false,
        diasTrial: 0,
        ativo: true,
        recursos: [],
      });
      setRecursosInput("");
    }
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (
        !formData.nome ||
        !formData.produtoId ||
        formData.valor === undefined
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha nome, produto e valor.",
          variant: "destructive",
        });
        return;
      }

      // Process resources from string to array
      const recursosArray = recursosInput
        .split(",")
        .map((r) => r.trim())
        .filter((r) => r.length > 0);

      const payload = {
        ...formData,
        recursos: recursosArray,
      };

      if (planoEditando) {
        await planoService.update(planoEditando.id, payload as UpdatePlanoDTO);
        toast({
          title: "Sucesso",
          description: "Plano atualizado com sucesso.",
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { ativo, ...createData } = payload;
        await planoService.create(createData as CreatePlanoDTO);
        toast({ title: "Sucesso", description: "Plano criado com sucesso." });
      }

      setModalAberto(false);
      loadData();
    } catch (error) {
      console.error("Erro ao salvar plano:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o plano.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (plano: Plano) => {
    if (!confirm(`Tem certeza que deseja excluir ${plano.nome}?`)) return;

    try {
      await planoService.delete(plano.id);
      toast({ title: "Sucesso", description: "Plano excluído com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao excluir plano:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o plano.",
        variant: "destructive",
      });
    }
  };

  const handleDuplicar = async (plano: Plano) => {
    try {
      const novoPlano: CreatePlanoDTO = {
        nome: `${plano.nome} (Cópia)`,
        descricao: plano.descricao,
        produtoId: plano.produtoId,
        tipoCobranca: plano.tipoCobranca,
        valor: plano.valor,
        limiteUsuarios: plano.limiteUsuarios,
        trial: plano.trial,
        diasTrial: plano.diasTrial,
        recursos: plano.recursos,
      };

      await planoService.create(novoPlano);
      toast({ title: "Sucesso", description: "Plano duplicado com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao duplicar plano:", error);
      toast({
        title: "Erro",
        description: "Não foi possível duplicar o plano.",
        variant: "destructive",
      });
    }
  };

  const columns: Column<Plano>[] = [
    {
      key: "nome",
      header: "Plano",
      cell: (plano) => (
        <div>
          <p className="font-medium">{plano.nome}</p>
          <p className="text-xs text-muted-foreground">
            {plano.produtoNome || "Produto desconhecido"}
          </p>
        </div>
      ),
    },
    {
      key: "valor",
      header: "Valor",
      cell: (plano) => (
        <div>
          <p className="font-medium">
            {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(plano.valor)}
          </p>
          <p className="text-xs text-muted-foreground">{plano.tipoCobranca}</p>
        </div>
      ),
    },
    {
      key: "limiteUsuarios",
      header: "Usuários",
      cell: (plano) => (
        <span className="text-sm">
          {plano.limiteUsuarios
            ? `${plano.limiteUsuarios} usuários`
            : "Ilimitado"}
        </span>
      ),
      header: "Criado em",
      cell: (plano) => (
        <span className="text-sm text-muted-foreground">
          {new Date(plano.criadoEm).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const actions: Action<Plano>[] = [
    {
      label: "Editar",
      onClick: (plano) => handleOpenModal(plano),
    },
    {
      label: "Duplicar",
      onClick: handleDuplicar,
      icon: Copy,
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
        title="Planos"
        description="Gerencie os planos de assinatura"
        icon={CreditCard}
        action={{
          label: "Novo Plano",
          onClick: () => handleOpenModal(),
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
            <DialogTitle>
              {planoEditando ? "Editar Plano" : "Novo Plano"}
            </DialogTitle>
            <DialogDescription>
              {planoEditando
                ? "Atualize as informações do plano"
                : "Preencha os dados para cadastrar um novo plano"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="produto">Produto</Label>
              <Select
                value={formData.produtoId}
                onValueChange={(value) =>
                  setFormData({ ...formData, produtoId: value })
                }
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

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Plano</Label>
                <Input
                  id="nome"
                  value={formData.nome || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, nome: e.target.value })
                  }
                  placeholder="Ex: Basic, Pro, Enterprise"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tipoCobranca">Tipo de Cobrança</Label>
                <Select
                  value={formData.tipoCobranca}
                  onValueChange={(value: TipoCobranca) =>
                    setFormData({ ...formData, tipoCobranca: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="FIXO">Valor Fixo</SelectItem>
                    <SelectItem value="USUARIO">Por Usuário</SelectItem>
                    <SelectItem value="RECURSO">Por Recurso</SelectItem>
                    <SelectItem value="VOLUME">Por Volume</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="valor">Valor Mensal (R$)</Label>
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
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descrição detalhada do plano"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recursos">Recursos (separados por vírgula)</Label>
              <Textarea
                id="recursos"
                value={recursosInput}
                onChange={(e) => setRecursosInput(e.target.value)}
                placeholder="Ex: Suporte 24/7, Backup diário, API ilimitada"
              />
            </div>

            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="trial" className="flex flex-col space-y-1">
                <span>Período de Teste (Trial)</span>
                <span className="font-normal text-xs text-muted-foreground">
                  Habilitar período gratuito para novos clientes
                </span>
              </Label>
              <Switch
                id="trial"
                checked={formData.trial}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, trial: checked })
                }
              />
            </div>

            {formData.trial && (
              <div className="space-y-2">
                <Label htmlFor="diasTrial">Dias de Trial</Label>
                <Input
                  id="diasTrial"
                  type="number"
                  value={formData.diasTrial || 0}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      diasTrial: parseInt(e.target.value),
                    })
                  }
                  placeholder="Ex: 14"
                />
              </div>
            )}

            {planoEditando && (
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
                : planoEditando
                ? "Salvar"
                : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
