import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router-dom";
import {
  DollarSign,
  Plus,
  FileText,
  Download,
  Ban,
  CheckCircle,
  Printer,
  Mail,
  Edit,
  Trash2,
  Calendar,
  Info,
  Repeat,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import authService from "@/services/auth.service";
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
import { configService } from "@/services/config.service";
import licencaService from "@/services/licenca.service";
import {
  TituloFinanceiro,
  CreateTituloDTO,
  UpdateTituloDTO,
  StatusTitulo,
  FormaPagamento,
  Periodicidade,
  RegistrarPagamentoDTO,
} from "@/types/financeiro.types";
import { Licenca } from "@/types/licenca.types";
import { EmailTemplate } from "@/types/config.types";
import { ApiError } from "@/types";
import { ApiErrorAlert } from "@/components/ApiErrorAlert";

export default function Financeiro() {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const licencaIdParam = queryParams.get("licencaId");

  const [titulos, setTitulos] = useState<TituloFinanceiro[]>([]);
  const [licencas, setLicencas] = useState<Licenca[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalAberto, setModalAberto] = useState(false);
  const [modalPagamentoAberto, setModalPagamentoAberto] = useState(false);
  const [modalEmailAberto, setModalEmailAberto] = useState(false);
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [selectedTitulo, setSelectedTitulo] = useState<TituloFinanceiro | null>(
    null
  );
  const { toast } = useToast();
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const user = authService.getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [formData, setFormData] = useState<Partial<CreateTituloDTO>>({
    recorrente: false,
    vincularLicenca: false,
  });

  const [pagamentoData, setPagamentoData] = useState<
    Partial<RegistrarPagamentoDTO>
  >({
    dataBaixa: new Date().toISOString().split("T")[0],
    formaPagamento: "PIX",
  });

  const [emailData, setEmailData] = useState({
    destinatario: "",
    assunto: "",
    mensagem: "",
    anexarComprovante: true,
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { size: 100 };
      if (licencaIdParam) {
        params.licencaId = licencaIdParam;
      }

      const [titulosRes, licencasRes] = await Promise.all([
        financeiroService.getAll(params),
        licencaService.getAll({ size: 100 }),
      ]);
      console.log("Financeiro - Titulos Res:", titulosRes);
      console.log("Financeiro - Licencas Res:", licencasRes);
      setTitulos(
        Array.isArray(titulosRes) ? titulosRes : titulosRes?.content || []
      );
      setLicencas(
        Array.isArray(licencasRes) ? licencasRes : licencasRes?.content || []
      );
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
  }, [licencaIdParam, toast]);

  const loadTemplates = async () => {
    try {
      const data = await configService.getTemplates();
      setTemplates(data);
    } catch (error) {
      console.error("Erro ao carregar templates:", error);
    }
  };

  useEffect(() => {
    loadData();
    loadTemplates();
  }, [loadData]);

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

      setIsLoading(true);
      if (selectedTitulo) {
        await financeiroService.update(
          selectedTitulo.id,
          formData as UpdateTituloDTO
        );
        toast({
          title: "Sucesso",
          description: "Título atualizado com sucesso.",
        });
      } else {
        await financeiroService.create(formData as CreateTituloDTO);
        toast({ title: "Sucesso", description: "Título criado com sucesso." });
      }

      setModalAberto(false);
      setSelectedTitulo(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao salvar título:", error);
      const backendError = error.response?.data as ApiError;
      setApiError(backendError);

      toast({
        title: "Erro",
        description:
          backendError?.message || "Não foi possível salvar o título.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedTitulo) return;
    try {
      setIsLoading(true);
      await financeiroService.registrarPagamento(
        selectedTitulo.id,
        pagamentoData as RegistrarPagamentoDTO
      );
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso.",
      });
      setModalPagamentoAberto(false);
      setSelectedTitulo(null);
      loadData();
    } catch (error: any) {
      console.error("Erro ao registrar pagamento:", error);
      const backendError = error.response?.data as ApiError;
      setApiError(backendError);

      toast({
        title: "Erro",
        description:
          backendError?.message || "Não foi possível registrar o pagamento.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = async (titulo: TituloFinanceiro) => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem cancelar títulos.",
        variant: "destructive",
      });
      return;
    }

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

  const handleExcluir = async (titulo: TituloFinanceiro) => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem excluir títulos.",
        variant: "destructive",
      });
      return;
    }

    if (
      !confirm(
        `Tem certeza que deseja EXCLUIR permanentemente o título ${titulo.numero}?`
      )
    )
      return;

    try {
      await financeiroService.delete(titulo.id);
      toast({ title: "Sucesso", description: "Título excluído com sucesso." });
      loadData();
    } catch (error) {
      console.error("Erro ao excluir título:", error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o título.",
        variant: "destructive",
      });
    }
  };

  const handleEnviarEmail = async () => {
    if (!selectedTitulo) return;
    setIsLoading(true);
    try {
      await financeiroService.enviarCobrancaEmail(selectedTitulo.id, emailData);
      toast({
        title: "E-mail enviado",
        description: "A cobrança foi enviada com sucesso para o cliente.",
      });
      setModalEmailAberto(false);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao enviar",
        description: "Não foi possível enviar o e-mail de cobrança.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAplicarTemplate = (templateId: string) => {
    const template = templates.find((t) => t.id === templateId);
    if (template && selectedTitulo) {
      const corpoProcessado = template.corpo
        .replace("{{nome}}", selectedTitulo.clienteNome)
        .replace(
          "{{valor}}",
          selectedTitulo.valor.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
          })
        )
        .replace(
          "{{vencimento}}",
          new Date(selectedTitulo.dataVencimento).toLocaleDateString("pt-BR")
        )
        .replace("{{numero}}", selectedTitulo.numero);

      setEmailData({
        ...emailData,
        assunto: template.assunto.replace(
          "{{nome}}",
          selectedTitulo.clienteNome
        ),
        mensagem: corpoProcessado,
      });
    }
  };

  const handleImprimirLocal = (titulo: TituloFinanceiro) => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Comprovante - ${titulo.numero}</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #333; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: bold; color: #000; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
            .label { font-size: 12px; color: #666; text-transform: uppercase; }
            .value { font-size: 16px; font-weight: 500; margin-top: 4px; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; pt: 20px; font-size: 12px; color: #999; text-align: center; }
            .status { display: inline-block; padding: 4px 12px; border-radius: 4px; background: #e6fffa; color: #2c7a7b; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">Comprovante de Pagamento</div>
            <p>Núcleo Admin - Sistema de Gestão</p>
          </div>
          <div class="grid">
            <div>
              <div class="label">Número do Título</div>
              <div class="value">${titulo.numero}</div>
            </div>
            <div>
              <div class="label">Status</div>
              <div class="value"><span class="status">${
                titulo.status
              }</span></div>
            </div>
            <div>
              <div class="label">Cliente</div>
              <div class="value">${titulo.clienteNome}</div>
            </div>
            <div>
              <div class="label">Data de Pagamento</div>
              <div class="value">${
                titulo.dataPagamento
                  ? new Date(titulo.dataPagamento).toLocaleDateString()
                  : "-"
              }</div>
            </div>
            <div>
              <div class="label">Valor Pago</div>
              <div class="value">R$ ${titulo.valor.toLocaleString("pt-BR", {
                minimumFractionDigits: 2,
              })}</div>
            </div>
            <div>
              <div class="label">Forma de Pagamento</div>
              <div class="value">${
                titulo.formaPagamento || "Não informada"
              }</div>
            </div>
          </div>
          <div style="margin-top: 30px;">
            <div class="label">Descrição</div>
            <div class="value">${titulo.descricao}</div>
          </div>
          ${
            titulo.observacoes
              ? `
          <div style="margin-top: 20px;">
            <div class="label">Observações</div>
            <div class="value">${titulo.observacoes}</div>
          </div>`
              : ""
          }
          <div class="footer">
            Este documento é um comprovante gerado eletronicamente em ${new Date().toLocaleString()}<br>
            Núcleo Admin &copy; ${new Date().getFullYear()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
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
      onClick: (titulo) => {
        setSelectedTitulo(titulo);
        setApiError(null);
        setModalPagamentoAberto(true);
      },
      icon: CheckCircle,
      hide: (titulo) =>
        titulo.status === "PAGO" || titulo.status === "CANCELADO",
    },
    {
      label: "Editar",
      onClick: (titulo) => {
        setSelectedTitulo(titulo);
        setFormData({
          licencaId: titulo.licencaId,
          descricao: titulo.descricao,
          valor: titulo.valor,
          dataVencimento: titulo.dataVencimento,
          formaPagamento: titulo.formaPagamento || undefined,
          observacoes: titulo.observacoes || undefined,
        });
        setApiError(null);
        setModalAberto(true);
      },
      icon: Edit,
      hide: (titulo) =>
        titulo.status === "PAGO" || titulo.status === "CANCELADO",
    },
    {
      label: "Imprimir Comprovante",
      onClick: (titulo) => handleImprimirLocal(titulo),
      icon: Printer,
      hide: (titulo) => titulo.status !== "PAGO",
    },
    {
      label: "Enviar por E-mail",
      onClick: (titulo) => {
        setSelectedTitulo(titulo);
        setEmailData({
          destinatario: "cliente@email.com",
          assunto: `Cobrança - Título ${titulo.numero}`,
          mensagem: `Olá, segue em anexo os detalhes da cobrança referente a ${titulo.descricao}.`,
          anexarComprovante: titulo.status === "PAGO",
        });
        setApiError(null);
        setModalEmailAberto(true);
      },
      icon: Mail,
      hide: (titulo) => titulo.status === "CANCELADO",
    },
    {
      label: "Cancelar",
      onClick: handleCancelar,
      variant: "destructive",
      icon: Ban,
      hide: (titulo) =>
        !isAdmin || titulo.status === "PAGO" || titulo.status === "CANCELADO",
    },
    {
      label: "Excluir",
      onClick: handleExcluir,
      variant: "destructive",
      icon: Trash2,
      hide: (titulo) => !isAdmin || titulo.status === "PAGO",
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
            setSelectedTitulo(null);
            setFormData({
              recorrente: false,
              vincularLicenca: false,
            });
            setApiError(null);
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

      <Dialog
        open={modalAberto}
        onOpenChange={(open) => {
          setModalAberto(open);
          if (!open) {
            setSelectedTitulo(null);
            setFormData({ recorrente: false, vincularLicenca: false });
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTitulo ? "Editar Título" : "Novo Título"}
            </DialogTitle>
            <DialogDescription>
              {selectedTitulo
                ? "Altere os dados do título financeiro"
                : "Crie um novo título financeiro"}
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} />

          <div className="grid grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="licenca">Licença / Cliente</Label>
                <Select
                  value={formData.licencaId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, licencaId: value })
                  }
                  disabled={!!selectedTitulo}
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
                      setFormData({
                        ...formData,
                        dataVencimento: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Forma de Pagamento Preferencial</Label>
                <Select
                  value={formData.formaPagamento}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      formaPagamento: value as FormaPagamento,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PIX">PIX</SelectItem>
                    <SelectItem value="BOLETO">Boleto</SelectItem>
                    <SelectItem value="CARTAO_CREDITO">
                      Cartão de Crédito
                    </SelectItem>
                    <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4 border-l pl-6">
              {!selectedTitulo && (
                <>
                  <div className="flex items-center space-x-2 bg-primary/5 p-3 rounded-lg border border-primary/10">
                    <Checkbox
                      id="recorrente"
                      checked={formData.recorrente}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, recorrente: !!checked })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="recorrente"
                        className="text-sm font-medium leading-none flex items-center gap-1"
                      >
                        <Repeat className="h-3 w-3" /> Título Recorrente
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Gerar várias parcelas automaticamente
                      </p>
                    </div>
                  </div>

                  {formData.recorrente && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label>Periodicidade</Label>
                        <Select
                          value={formData.periodicidade}
                          onValueChange={(value) =>
                            setFormData({
                              ...formData,
                              periodicidade: value as Periodicidade,
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MENSAL">Mensal</SelectItem>
                            <SelectItem value="TRIMESTRAL">
                              Trimestral
                            </SelectItem>
                            <SelectItem value="SEMESTRAL">Semestral</SelectItem>
                            <SelectItem value="ANUAL">Anual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Quantidade de Parcelas</Label>
                        <Input
                          type="number"
                          min={2}
                          max={60}
                          value={formData.quantidadeParcelas || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              quantidadeParcelas: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center space-x-2 p-3 rounded-lg border border-border">
                    <Checkbox
                      id="vincularLicenca"
                      checked={formData.vincularLicenca}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, vincularLicenca: !!checked })
                      }
                    />
                    <div className="grid gap-1.5 leading-none">
                      <label
                        htmlFor="vincularLicenca"
                        className="text-sm font-medium leading-none flex items-center gap-1"
                      >
                        <Calendar className="h-3 w-3" /> Vincular à Licença
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Usar tempo de expiração da licença
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="obs">Observações</Label>
                <Textarea
                  id="obs"
                  value={formData.observacoes || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, observacoes: e.target.value })
                  }
                  placeholder="Informações adicionais..."
                  className="h-24 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => setModalAberto(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={isLoading}>
              {isLoading
                ? "Salvando..."
                : selectedTitulo
                ? "Atualizar"
                : "Cadastrar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Registro de Pagamento */}
      <Dialog
        open={modalPagamentoAberto}
        onOpenChange={setModalPagamentoAberto}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-success" /> Registrar
              Pagamento
            </DialogTitle>
            <DialogDescription>
              Informe os detalhes da baixa do título #{selectedTitulo?.numero}
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} />

          <div className="space-y-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center">
              <span className="text-sm">Valor a Receber:</span>
              <span className="font-bold text-lg">
                R${" "}
                {selectedTitulo?.valor.toLocaleString("pt-BR", {
                  minimumFractionDigits: 2,
                })}
              </span>
            </div>

            <div className="space-y-2">
              <Label>Data da Baixa (Pagamento)</Label>
              <Input
                type="date"
                value={pagamentoData.dataBaixa}
                onChange={(e) =>
                  setPagamentoData({
                    ...pagamentoData,
                    dataBaixa: e.target.value,
                  })
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Forma de Pagamento</Label>
              <Select
                value={pagamentoData.formaPagamento}
                onValueChange={(value) =>
                  setPagamentoData({
                    ...pagamentoData,
                    formaPagamento: value as FormaPagamento,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="CARTAO_CREDITO">
                    Cartão de Crédito
                  </SelectItem>
                  <SelectItem value="CARTAO_DEBITO">
                    Cartão de Débito
                  </SelectItem>
                  <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                  <SelectItem value="TRANSFERENCIA">Transferência</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Observações da Baixa</Label>
              <Textarea
                placeholder="Ex: Pago via transferência bancária, comprovante anexo..."
                value={pagamentoData.observacoes || ""}
                onChange={(e) =>
                  setPagamentoData({
                    ...pagamentoData,
                    observacoes: e.target.value,
                  })
                }
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalPagamentoAberto(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmarPagamento}
              className="bg-success hover:bg-success/90 text-white"
            >
              Confirmar Recebimento
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de Envio de E-mail */}
      <Dialog open={modalEmailAberto} onOpenChange={setModalEmailAberto}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" /> Enviar Cobrança por
              E-mail
            </DialogTitle>
            <DialogDescription>
              Configure os detalhes do envio para o cliente.
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} />

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Template (Opcional)</Label>
              <Select onValueChange={handleAplicarTemplate}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um template para preencher" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.nome} ({t.tipo})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Destinatário</Label>
              <Input
                value={emailData.destinatario}
                onChange={(e) =>
                  setEmailData({ ...emailData, destinatario: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Assunto</Label>
              <Input
                value={emailData.assunto}
                onChange={(e) =>
                  setEmailData({ ...emailData, assunto: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Mensagem</Label>
              <Textarea
                className="h-32"
                value={emailData.mensagem}
                onChange={(e) =>
                  setEmailData({ ...emailData, mensagem: e.target.value })
                }
              />
            </div>
            <div className="flex items-center space-x-2 bg-muted/50 p-3 rounded-lg">
              <Checkbox
                id="anexo"
                checked={emailData.anexarComprovante}
                onCheckedChange={(checked) =>
                  setEmailData({ ...emailData, anexarComprovante: !!checked })
                }
              />
              <label
                htmlFor="anexo"
                className="text-sm font-medium leading-none flex items-center gap-2"
              >
                <FileText className="h-4 w-4" /> Anexar Comprovante/Boleto (PDF)
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setModalEmailAberto(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleEnviarEmail} disabled={isLoading}>
              {isLoading ? "Enviando..." : "Enviar Agora"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
