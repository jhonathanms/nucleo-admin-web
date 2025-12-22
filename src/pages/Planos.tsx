import { Action, Column, DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import planoService from "@/services/plano.service";
import produtoService from "@/services/produto.service";
import { Plano, CreatePlanoDTO, TipoCobranca, UpdatePlanoDTO } from "@/types";
import { Produto } from "@/types/produto.types";
import { useApiError } from "@/hooks/use-api-error";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Calculator, Copy, CreditCard, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

export default function Planos() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const produtoIdParam = queryParams.get("produtoId");

  const [planos, setPlanos] = useState<Plano[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [planoEditando, setPlanoEditando] = useState<Plano | null>(null);
  const { toast } = useToast();
  const { apiError, handleError, clearError } = useApiError();

  // Local state for form fields
  const [formData, setFormData] = useState<Partial<Plano>>({
    tipoCobranca: "FIXO",
    valor: 0,
    valorBase: 0,
    valorPorUsuario: 0,
    quantidadePacotes: 1,
    usuariosPorPacote: 10,
    trial: false,
    diasTrial: 0,
    ativo: true,
    recursos: [],
    recursosDetalhados: [],
  });

  // Helper state for comma-separated resources input
  const [recursosInput, setRecursosInput] = useState("");

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

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      let planosRes;
      if (produtoIdParam) {
        planosRes = await planoService.getByProduto(produtoIdParam, {
          size: 100,
        });
      } else {
        planosRes = await planoService.getAll({ size: 100 });
      }

      const produtosRes = await produtoService.getAll({ size: 100 });

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
  }, [produtoIdParam, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Calculadora de Custos
  useEffect(() => {
    let total = 0;
    if (formData.tipoCobranca === "FIXO") {
      // No cálculo automático para FIXO, o valor é o que o usuário digitar
      return;
    } else if (formData.tipoCobranca === "USUARIO") {
      const base = formData.valorBase || 0;
      const porUsuario = formData.valorPorUsuario || 0;
      const qtd = formData.limiteUsuarios || 0;
      total = base + porUsuario * qtd;
    } else if (formData.tipoCobranca === "PACOTE_USUARIO") {
      const base = formData.valorBase || 0;
      const qtd = formData.quantidadePacotes || 0;
      total = base * qtd;

      // Atualiza limite de usuários automaticamente
      const usuPorPacote = formData.usuariosPorPacote || 0;
      const totalUsu = qtd * usuPorPacote;
      if (totalUsu !== formData.limiteUsuarios) {
        setFormData((prev) => ({ ...prev, limiteUsuarios: totalUsu }));
      }
    } else if (formData.tipoCobranca === "RECURSO") {
      total = (formData.recursosDetalhados || [])
        .filter((r) => r.ativo)
        .reduce((acc, r) => acc + r.valor, 0);
    }

    if (total !== formData.valor) {
      setFormData((prev) => ({ ...prev, valor: total }));
    }
  }, [
    formData.tipoCobranca,
    formData.valorBase,
    formData.valorPorUsuario,
    formData.limiteUsuarios,
    formData.quantidadePacotes,
    formData.usuariosPorPacote,
    formData.recursosDetalhados,
    formData.valor,
  ]);

  const handleOpenModal = (plano?: Plano) => {
    if (plano) {
      setPlanoEditando(plano);
      setFormData({
        nome: plano.nome,
        descricao: plano.descricao,
        produtoId: plano.produtoId,
        tipoCobranca: plano.tipoCobranca,
        valor: plano.valor,
        valorBase: plano.valorBase || 0,
        valorPorUsuario: plano.valorPorUsuario || 0,
        quantidadePacotes: plano.quantidadePacotes || 1,
        usuariosPorPacote: plano.usuariosPorPacote || 10,
        limiteUsuarios: plano.limiteUsuarios,
        trial: plano.trial,
        diasTrial: plano.diasTrial,
        ativo: plano.ativo,
        recursos: plano.recursos,
        recursosDetalhados: plano.recursosDetalhados || [],
      });
      setRecursosInput(plano.recursos ? plano.recursos.join(", ") : "");
    } else {
      setPlanoEditando(null);
      setFormData({
        tipoCobranca: "FIXO",
        valor: 0,
        valorBase: 0,
        valorPorUsuario: 0,
        quantidadePacotes: 1,
        usuariosPorPacote: 10,
        trial: false,
        diasTrial: 0,
        ativo: true,
        recursos: [],
        recursosDetalhados: [],
      });
      setRecursosInput("");
    }
    clearError();
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
        const { ativo, ...createData } = payload;
        await planoService.create(createData as CreatePlanoDTO);
        toast({ title: "Sucesso", description: "Plano criado com sucesso." });
      }
      setModalAberto(false);
      loadData();
    } catch (error) {
      handleError(error, "Não foi possível salvar o plano.");
    }
  };

  const handleDelete = (plano: Plano) => {
    setConfirmModal({
      open: true,
      title: "Excluir Plano",
      description: `Tem certeza que deseja excluir o plano "${plano.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await planoService.delete(plano.id);
          toast({
            title: "Sucesso",
            description: "Plano excluído com sucesso.",
          });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível excluir o plano.");
        }
      },
    });
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
      handleError(error, "Não foi possível duplicar o plano.");
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
          <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-wider">
            {plano.tipoCobranca === "USUARIO"
              ? "Por Usuário"
              : plano.tipoCobranca === "PACOTE_USUARIO"
              ? "Por Pacote"
              : plano.tipoCobranca === "RECURSO"
              ? "Por Recurso"
              : "Valor Fixo"}
          </p>
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
    },
    {
      key: "criadoEm",
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

          <ApiErrorAlert error={apiError} />

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

            <div className="grid grid-cols-1 gap-4">
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
                <Label htmlFor="descricao">Descrição</Label>
                <Textarea
                  id="descricao"
                  value={formData.descricao || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, descricao: e.target.value })
                  }
                  placeholder="Descrição detalhada do plano"
                  className="h-20"
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
                    <SelectItem value="PACOTE_USUARIO">
                      Por Pacote de Usuários
                    </SelectItem>
                    <SelectItem value="RECURSO">Por Recurso</SelectItem>

                    {/* Desabilitado temporariamente!! <SelectItem value="VOLUME">Por Volume</SelectItem> */}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {formData.tipoCobranca === "FIXO" && (
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
            )}

            {/* Calculadora e Campos Dinâmicos (Oculto para FIXO) */}
            {formData.tipoCobranca !== "FIXO" && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-4">
                <div className="flex items-center gap-2 text-primary font-semibold text-sm mb-2">
                  <Calculator className="h-4 w-4" />
                  Calculadora de Custos
                </div>

                {formData.tipoCobranca === "USUARIO" && (
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Por Usuário</Label>
                      <Input
                        type="number"
                        value={formData.valorPorUsuario || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            valorPorUsuario: parseFloat(e.target.value),
                          })
                        }
                        placeholder="0.00"
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Qtd. Usuários</Label>
                      <Input
                        type="number"
                        value={formData.limiteUsuarios || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            limiteUsuarios: parseInt(e.target.value),
                          })
                        }
                        placeholder="0"
                        className="bg-background"
                      />
                    </div>
                  </div>
                )}

                {formData.tipoCobranca === "PACOTE_USUARIO" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Valor Base</Label>
                        <Input
                          type="number"
                          value={formData.valorBase || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              valorBase: parseFloat(e.target.value),
                            })
                          }
                          placeholder="0.00"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Qtde. Pacotes</Label>
                        <Input
                          type="number"
                          value={formData.quantidadePacotes || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantidadePacotes: parseInt(e.target.value),
                            })
                          }
                          placeholder="1"
                          className="bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Usuários/Pacote</Label>
                        <Input
                          type="number"
                          value={formData.usuariosPorPacote || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usuariosPorPacote: parseInt(e.target.value),
                            })
                          }
                          placeholder="10"
                          className="bg-background"
                        />
                      </div>
                    </div>

                    <div className="pt-2">
                      <p className="text-[10px] text-muted-foreground italic">
                        * O Valor Total pode ser editado diretamente no rodapé
                        da calculadora.
                      </p>
                    </div>
                  </div>
                )}

                {formData.tipoCobranca === "RECURSO" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Módulos do Produto</Label>
                      <Select
                        onValueChange={(value) => {
                          const novos = [
                            ...(formData.recursosDetalhados || []),
                          ];
                          if (!novos.find((n) => n.nome === value)) {
                            novos.push({
                              nome: value,
                              valor: 0,
                              ativo: true,
                            });
                            setFormData({
                              ...formData,
                              recursosDetalhados: novos,
                            });
                          }
                        }}
                      >
                        <SelectTrigger className="h-8 w-[150px] text-xs">
                          <SelectValue placeholder="+ Adicionar" />
                        </SelectTrigger>
                        <SelectContent>
                          {produtos
                            .find((p) => p.id === formData.produtoId)
                            ?.modulos?.filter(
                              (m) =>
                                !(formData.recursosDetalhados || []).find(
                                  (rd) => rd.nome === m
                                )
                            )
                            .map((m) => (
                              <SelectItem key={m} value={m}>
                                {m}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 max-h-[150px] overflow-y-auto pr-2">
                      {(formData.recursosDetalhados || []).length === 0 && (
                        <div className="text-center py-4 border border-dashed rounded-md text-muted-foreground text-xs">
                          Nenhum módulo selecionado
                        </div>
                      )}
                      {(formData.recursosDetalhados || []).map(
                        (recurso, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 bg-background p-2 rounded-md border border-border"
                          >
                            <Switch
                              checked={recurso.ativo}
                              onCheckedChange={(checked) => {
                                const novos = [
                                  ...(formData.recursosDetalhados || []),
                                ];
                                novos[idx].ativo = checked;
                                setFormData({
                                  ...formData,
                                  recursosDetalhados: novos,
                                });
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium truncate">
                                {recurso.nome}
                              </p>
                            </div>
                            <Input
                              type="number"
                              className="h-8 text-xs w-20"
                              value={recurso.valor}
                              onChange={(e) => {
                                const novos = [
                                  ...(formData.recursosDetalhados || []),
                                ];
                                novos[idx].valor = parseFloat(e.target.value);
                                setFormData({
                                  ...formData,
                                  recursosDetalhados: novos,
                                });
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => {
                                const novos = (
                                  formData.recursosDetalhados || []
                                ).filter((_, i) => i !== idx);
                                setFormData({
                                  ...formData,
                                  recursosDetalhados: novos,
                                });
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-primary/10 flex justify-between items-center">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                      Total Mensal Estimado
                    </span>
                    {formData.tipoCobranca === "PACOTE_USUARIO" && (
                      <span className="text-[9px] text-primary/70">
                        ({formData.limiteUsuarios} usuários inclusos)
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xl font-bold text-primary">R$</span>
                    <Input
                      className="text-xl font-bold text-primary"
                      type="number"
                      step="0.01"
                      value={
                        formData.valor == undefined || formData.valor == 0
                          ? ""
                          : formData.valor
                      }
                      onChange={(e) => {
                        const total = parseFloat(e.target.value) || 0;
                        if (formData.tipoCobranca === "PACOTE_USUARIO") {
                          const qtd = formData.quantidadePacotes || 1;
                          setFormData({
                            ...formData,
                            valor: total,
                            valorBase: total / qtd,
                          });
                        } else if (formData.tipoCobranca === "USUARIO") {
                          const porUsuario = formData.valorPorUsuario || 0;
                          const qtd = formData.limiteUsuarios || 0;
                          setFormData({
                            ...formData,
                            valor: total,
                            valorBase: total - porUsuario * qtd,
                          });
                        } else {
                          setFormData({ ...formData, valor: total });
                        }
                      }}
                      readOnly={formData.tipoCobranca === "RECURSO"}
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="recursos">
                Recursos para Exibição (separados por vírgula)
              </Label>
              <Textarea
                id="recursos"
                value={recursosInput}
                onChange={(e) => setRecursosInput(e.target.value)}
                placeholder="Ex: Suporte 24/7, Backup diário, API ilimitada"
                className="h-16"
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
