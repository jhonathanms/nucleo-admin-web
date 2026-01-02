import { useState, useEffect, useCallback } from "react";
import { Box, Plus, Trash2, CheckCircle2, XCircle } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import recursoService from "@/services/recurso.service";
import {
  Recurso,
  CreateRecursoDTO,
  UpdateRecursoDTO,
} from "@/types/recurso.types";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Recursos() {
  const [recursos, setRecursos] = useState<Recurso[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [recursoEditando, setRecursoEditando] = useState<Recurso | null>(null);
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

  const [formData, setFormData] = useState<Partial<Recurso>>({
    nome: "",
    chave: "",
    descricao: "",
    ativo: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await recursoService.getAll({ size: 100 });
      setRecursos(res.content);
    } catch (error) {
      console.error("Erro ao carregar recursos:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os recursos.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenModal = (recurso?: Recurso) => {
    if (recurso) {
      setRecursoEditando(recurso);
      setFormData({
        nome: recurso.nome,
        chave: recurso.chave,
        descricao: recurso.descricao,
        ativo: recurso.ativo,
      });
    } else {
      setRecursoEditando(null);
      setFormData({
        nome: "",
        chave: "",
        descricao: "",
        ativo: true,
      });
    }
    clearError();
    setModalAberto(true);
  };

  const handleSalvar = async () => {
    try {
      if (!formData.nome || !formData.chave) {
        toast({
          title: "Campos obrigatórios",
          description: "Preencha o nome e a chave do recurso.",
          variant: "destructive",
        });
        return;
      }

      if (recursoEditando) {
        await recursoService.update(
          recursoEditando.id,
          formData as UpdateRecursoDTO
        );
        toast({
          title: "Sucesso",
          description: "Recurso atualizado com sucesso.",
        });
      } else {
        await recursoService.create(formData as CreateRecursoDTO);
        toast({ title: "Sucesso", description: "Recurso criado com sucesso." });
      }

      setModalAberto(false);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível salvar o recurso.");
    }
  };

  const handleDelete = (recurso: Recurso) => {
    setConfirmModal({
      open: true,
      title: "Excluir Recurso",
      description: `Tem certeza que deseja excluir o recurso "${recurso.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await recursoService.delete(recurso.id);
          toast({
            title: "Sucesso",
            description: "Recurso excluído com sucesso.",
          });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível excluir o recurso.");
        }
      },
    });
  };

  const columns: Column<Recurso>[] = [
    {
      key: "nome",
      header: "Recurso / Módulo",
      cell: (recurso) => (
        <div>
          <p className="font-medium">{recurso.nome}</p>
          <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider">
            {recurso.chave}
          </p>
        </div>
      ),
    },
    {
      key: "descricao",
      header: "Descrição",
      cell: (recurso) => (
        <p className="text-sm text-muted-foreground max-w-xs truncate">
          {recurso.descricao || "-"}
        </p>
      ),
    },
    {
      key: "ativo",
      header: "Status",
      cell: (recurso) => (
        <StatusBadge
          status={recurso.ativo ? "ATIVO" : "INATIVO"}
          variant={recurso.ativo ? "success" : "default"}
        />
      ),
    },
    {
      key: "criadoEm",
      header: "Criado em",
      cell: (recurso) => (
        <span className="text-sm text-muted-foreground">
          {new Date(recurso.criadoEm).toLocaleDateString("pt-BR")}
        </span>
      ),
    },
  ];

  const actions: Action<Recurso>[] = [
    {
      label: "Editar",
      onClick: (recurso) => handleOpenModal(recurso),
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
        title="Recursos e Módulos"
        description="Gerencie os módulos disponíveis para os planos"
        icon={Box}
        action={{
          label: "Novo Recurso",
          onClick: () => handleOpenModal(),
          icon: Plus,
        }}
      />

      <DataTable
        data={recursos}
        columns={columns}
        actions={actions}
        searchKey="nome"
        searchPlaceholder="Buscar por nome..."
      />

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {recursoEditando ? "Editar Recurso" : "Novo Recurso"}
            </DialogTitle>
            <DialogDescription>
              Cadastre módulos que poderão ser vinculados aos planos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Recurso</Label>
              <Input
                id="nome"
                value={formData.nome || ""}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Módulo Financeiro"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chave">Chave Identificadora (API)</Label>
              <Input
                id="chave"
                value={formData.chave || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    chave: e.target.value.toUpperCase().replace(/\s+/g, "_"),
                  })
                }
                placeholder="Ex: MOD_FINANCEIRO"
                className="font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                * Use apenas letras maiúsculas e sublinhados.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao || ""}
                onChange={(e) =>
                  setFormData({ ...formData, descricao: e.target.value })
                }
                placeholder="Descreva o que este módulo oferece"
                className="h-24"
              />
            </div>

            {recursoEditando && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border">
                <Label htmlFor="ativo" className="flex flex-col gap-1">
                  <span>Status do Recurso</span>
                  <span className="font-normal text-xs text-muted-foreground">
                    Recursos inativos não aparecem na calculadora
                  </span>
                </Label>
                <Button
                  variant={formData.ativo ? "outline" : "destructive"}
                  size="sm"
                  onClick={() =>
                    setFormData({ ...formData, ativo: !formData.ativo })
                  }
                  className="gap-2"
                >
                  {formData.ativo ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {formData.ativo ? "Ativo" : "Inativo"}
                </Button>
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
                : recursoEditando
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
