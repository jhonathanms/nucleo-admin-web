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
  File,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { ApiErrorAlert } from "@/components/ApiErrorAlert";
import { useApiError } from "@/hooks/use-api-error";
import { ConfirmDialog } from "@/components/ConfirmDialog";

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
  const user = authService.getStoredUser();
  const isAdmin = user?.role === "ADMIN";

  const [formData, setFormData] = useState<Partial<CreateTituloDTO>>({
    recorrente: false,
    vincularLicenca: false,
    periodicidade: "MENSAL",
    quantidadeParcelas: 12,
  });

  const [usarDiaPadrao, setUsarDiaPadrao] = useState(false);
  const [criarOutro, setCriarOutro] = useState(false);
  const [parcelasPreview, setParcelasPreview] = useState<
    { dataVencimento: string; valor: number }[]
  >([]);

  // Calcular parcelas automaticamente
  // Calcular parcelas automaticamente
  useEffect(() => {
    if (formData.recorrente && formData.periodicidade && formData.valor) {
      const parcelas = [];
      const hoje = new Date();
      let dia = hoje.getDate();

      // Se for mensal e usar dia padrão
      if (
        usarDiaPadrao &&
        formData.diaVencimentoPadrao &&
        formData.periodicidade === "MENSAL"
      ) {
        dia = formData.diaVencimentoPadrao;
      }

      // Determinar quantidade de parcelas
      // Se não for mensal, é sempre 1 parcela (cobrança única do período)
      const qtd =
        formData.periodicidade === "MENSAL"
          ? formData.quantidadeParcelas || 12
          : 1;

      for (let i = 0; i < qtd; i++) {
        const data = new Date(hoje.getFullYear(), hoje.getMonth(), dia);

        if (formData.periodicidade === "MENSAL") {
          data.setMonth(data.getMonth() + i + 1);
        } else {
          // Para outros períodos, a data de vencimento é o próximo mês (ou data atual + 1 mês de carência padrão?)
          // Geralmente cobra-se no início ou fim. Vamos assumir +1 mês como padrão de vencimento inicial
          data.setMonth(data.getMonth() + 1);
        }

        // Ajustar dia
        if (data.getDate() !== dia) {
          data.setDate(0);
        }

        parcelas.push({
          dataVencimento: data.toISOString().split("T")[0],
          valor: formData.valor,
        });
      }
      setParcelasPreview(parcelas);

      // Calcular Início e Fim da Cobrança para não-mensais (ou atualizar se necessário)
      if (formData.periodicidade !== "MENSAL") {
        const inicio = new Date();
        const fim = new Date(inicio);

        if (formData.periodicidade === "TRIMESTRAL")
          fim.setMonth(fim.getMonth() + 3);
        if (formData.periodicidade === "SEMESTRAL")
          fim.setMonth(fim.getMonth() + 6);
        if (formData.periodicidade === "ANUAL")
          fim.setFullYear(fim.getFullYear() + 1);

        setFormData((prev) => ({
          ...prev,
          periodoCobrancaInicio: inicio.toISOString().split("T")[0],
          periodoCobrancaFim: fim.toISOString().split("T")[0],
        }));
      }
    }
  }, [
    formData.recorrente,
    formData.periodicidade,
    formData.quantidadeParcelas,
    formData.valor,
    formData.diaVencimentoPadrao,
    usarDiaPadrao,
  ]);

  const handleUpdateParcelaDate = (index: number, newDate: string) => {
    const newParcelas = [...parcelasPreview];
    newParcelas[index].dataVencimento = newDate;
    setParcelasPreview(newParcelas);
    // Atualizar formData com as parcelas personalizadas
    setFormData((prev) => ({ ...prev, parcelasPersonalizadas: newParcelas }));
  };

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
      // Validação simplificada
      if (!formData.licencaId || !formData.valor) {
        toast({
          title: "Campos obrigatórios",
          description: "Licença/Cliente e Valor são obrigatórios.",
          variant: "destructive",
        });
        return;
      }

      if (formData.recorrente) {
        if (!formData.periodicidade || !formData.quantidadeParcelas) {
          toast({
            title: "Campos obrigatórios",
            description:
              "Para títulos recorrentes, informe a periodicidade e a quantidade de parcelas.",
            variant: "destructive",
          });
          return;
        }
      } else {
        // Se não for recorrente, vencimento é obrigatório? O usuário disse "O campo vencimento só deve aparecer se titulo recorrente estiver false".
        // Vou assumir que se aparecer, é obrigatório, ou talvez não. Vou deixar obrigatório se não recorrente.
        if (!formData.dataVencimento) {
          toast({
            title: "Campos obrigatórios",
            description:
              "Data de vencimento é obrigatória para títulos avulsos.",
            variant: "destructive",
          });
          return;
        }
      }

      const payload: any = { ...formData };

      // Formatar datas para o backend (LocalDateTime)
      if (payload.dataVencimento && !payload.dataVencimento.includes("T")) {
        payload.dataVencimento = `${payload.dataVencimento}T00:00:00`;
      }
      if (
        payload.periodoCobrancaInicio &&
        !payload.periodoCobrancaInicio.includes("T")
      ) {
        payload.periodoCobrancaInicio = `${payload.periodoCobrancaInicio}T00:00:00`;
      }
      if (
        payload.periodoCobrancaFim &&
        !payload.periodoCobrancaFim.includes("T")
      ) {
        payload.periodoCobrancaFim = `${payload.periodoCobrancaFim}T00:00:00`;
      }
      if (payload.parcelasPersonalizadas) {
        payload.parcelasPersonalizadas = payload.parcelasPersonalizadas.map(
          (p: any) => ({
            ...p,
            dataVencimento: p.dataVencimento.includes("T")
              ? p.dataVencimento
              : `${p.dataVencimento}T00:00:00`,
          })
        );
      }

      setIsLoading(true);
      if (selectedTitulo) {
        await financeiroService.update(
          selectedTitulo.id,
          payload as UpdateTituloDTO
        );
        toast({
          title: "Sucesso",
          description: "Título atualizado com sucesso.",
        });
      } else {
        await financeiroService.create(payload as CreateTituloDTO);
        toast({ title: "Sucesso", description: "Título criado com sucesso." });
      }

      setModalAberto(criarOutro);
      if (criarOutro) {
        // Manter alguns dados ou resetar parcialmente?
        // Resetar tudo exceto talvez licencaId se quiser cadastrar varios para o mesmo
        setFormData({
          recorrente: false,
          vincularLicenca: false,
          periodicidade: "MENSAL",
          quantidadeParcelas: 12,
          licencaId: formData.licencaId, // Mantém a licença selecionada para facilitar
        });
        setSelectedTitulo(null);
      } else {
        setModalAberto(false);
        setSelectedTitulo(null);
      }
      loadData();
    } catch (error: any) {
      handleError(error, "Não foi possível salvar o título.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecorrenteChange = (checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      recorrente: checked,
      vincularLicenca: checked ? false : prev.vincularLicenca,
    }));
  };

  const handleVincularLicencaChange = (checked: boolean) => {
    const updates: Partial<CreateTituloDTO> = {
      vincularLicenca: checked,
      recorrente: checked ? false : formData.recorrente,
    };

    if (checked && formData.licencaId) {
      const licenca = licencas.find((l) => l.id === formData.licencaId);
      if (licenca) {
        updates.periodoCobrancaInicio = new Date().toISOString().split("T")[0];
        updates.periodoCobrancaFim = licenca.dataExpiracao.split("T")[0];
      }
    }

    setFormData((prev) => ({ ...prev, ...updates }));
  };

  const handleConfirmarPagamento = async () => {
    if (!selectedTitulo) return;
    try {
      setIsLoading(true);

      const payload = {
        ...pagamentoData,
        dataBaixa:
          pagamentoData.dataBaixa && !pagamentoData.dataBaixa.includes("T")
            ? `${pagamentoData.dataBaixa}T00:00:00`
            : pagamentoData.dataBaixa,
      };

      await financeiroService.registrarPagamento(
        selectedTitulo.id,
        payload as RegistrarPagamentoDTO
      );
      toast({
        title: "Sucesso",
        description: "Pagamento registrado com sucesso.",
      });
      setModalPagamentoAberto(false);
      setSelectedTitulo(null);
      loadData();
    } catch (error: any) {
      handleError(error, "Não foi possível registrar o pagamento.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelar = (titulo: TituloFinanceiro) => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem cancelar títulos.",
        variant: "destructive",
      });
      return;
    }

    setConfirmModal({
      open: true,
      title: "Cancelar Título",
      description: `Tem certeza que deseja cancelar o título ${titulo.numero}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await financeiroService.cancelar(titulo.id);
          toast({
            title: "Sucesso",
            description: "Título cancelado com sucesso.",
          });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível cancelar o título.");
        }
      },
    });
  };

  const handleExcluir = (titulo: TituloFinanceiro) => {
    if (!isAdmin) {
      toast({
        title: "Acesso Negado",
        description: "Apenas administradores podem excluir títulos.",
        variant: "destructive",
      });
      return;
    }

    setConfirmModal({
      open: true,
      title: "Excluir Título",
      description: `Tem certeza que deseja EXCLUIR permanentemente o título ${titulo.numero}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        try {
          await financeiroService.delete(titulo.id);
          toast({
            title: "Sucesso",
            description: "Título excluído com sucesso.",
          });
          loadData();
          setConfirmModal((prev) => ({ ...prev, open: false }));
        } catch (error) {
          handleError(error, "Não foi possível excluir o título.");
        }
      },
    });
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
        clearError();
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
        clearError();
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
        clearError();
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

  const handleExportCSV = () => {
    // Determinar qual aba está ativa para filtrar os dados
    const activeTab =
      document
        .querySelector('[role="tab"][data-state="active"]')
        ?.getAttribute("value") || "todos";
    const dataToExport =
      activeTab === "todos" ? titulos : titulosFiltrados(activeTab);

    if (dataToExport.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Número",
      "Cliente",
      "Descrição",
      "Valor",
      "Vencimento",
      "Pagamento",
      "Status",
      "Forma Pagamento",
    ];

    const csvContent = [
      headers.join(";"),
      ...dataToExport.map((t) => {
        return [
          t.numero,
          t.clienteNome,
          `"${t.descricao.replace(/"/g, '""')}"`,
          t.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 }),
          new Date(t.dataVencimento).toLocaleDateString("pt-BR"),
          t.dataPagamento
            ? new Date(t.dataPagamento).toLocaleDateString("pt-BR")
            : "-",
          t.status,
          t.formaPagamento || "-",
        ].join(";");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `financeiro_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    // Determinar qual aba está ativa para filtrar os dados
    const activeTab =
      document
        .querySelector('[role="tab"][data-state="active"]')
        ?.getAttribute("value") || "todos";
    const dataToExport =
      activeTab === "todos" ? titulos : titulosFiltrados(activeTab);

    if (dataToExport.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const content = `
      <html>
        <head>
          <title>Relatório Financeiro</title>
          <style>
            body { font-family: sans-serif; padding: 20px; color: #333; }
            .header { border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 30px; display: flex; justify-content: space-between; align-items: center; }
            .title { font-size: 24px; font-weight: bold; color: #000; }
            .subtitle { font-size: 14px; color: #666; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { text-align: left; background-color: #f5f5f5; padding: 10px; border-bottom: 1px solid #ddd; font-weight: bold; }
            td { padding: 10px; border-bottom: 1px solid #eee; vertical-align: top; }
            .footer { margin-top: 50px; border-top: 1px solid #eee; padding-top: 20px; font-size: 10px; color: #999; text-align: center; }
            .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; }
            .badge-success { background: #dcfce7; color: #166534; }
            .badge-warning { background: #fef9c3; color: #854d0e; }
            .badge-destructive { background: #fee2e2; color: #b91c1c; }
            .badge-muted { background: #f3f4f6; color: #374151; }
            .text-right { text-align: right; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Relatório Financeiro</div>
              <div class="subtitle">Núcleo Admin - Sistema de Gestão</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
              <p>Registros: ${dataToExport.length}</p>
              <p>Total: R$ ${dataToExport
                .reduce((acc, t) => acc + t.valor, 0)
                .toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th width="10%">Número</th>
                <th width="25%">Cliente</th>
                <th width="25%">Descrição</th>
                <th width="10%">Vencimento</th>
                <th width="10%">Pagamento</th>
                <th width="10%">Status</th>
                <th width="10%" class="text-right">Valor</th>
              </tr>
            </thead>
            <tbody>
              ${dataToExport
                .map((t) => {
                  let variant = "muted";
                  if (t.status === "PAGO") variant = "success";
                  if (t.status === "PENDENTE") variant = "warning";
                  if (t.status === "EM_ATRASO") variant = "destructive";

                  return `
                  <tr>
                    <td>${t.numero}</td>
                    <td>${t.clienteNome}</td>
                    <td>${t.descricao}</td>
                    <td>${new Date(t.dataVencimento).toLocaleDateString(
                      "pt-BR"
                    )}</td>
                    <td>${
                      t.dataPagamento
                        ? new Date(t.dataPagamento).toLocaleDateString("pt-BR")
                        : "-"
                    }</td>
                    <td><span class="badge badge-${variant}">${
                    t.status
                  }</span></td>
                    <td class="text-right">R$ ${t.valor.toLocaleString(
                      "pt-BR",
                      { minimumFractionDigits: 2 }
                    )}</td>
                  </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>

          <div class="footer">
            Este documento é um relatório gerado eletronicamente.<br>
            Núcleo Admin &copy; ${new Date().getFullYear()}
          </div>
          <script>window.print();</script>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
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
            clearError();
            setModalAberto(true);
          },
          icon: Plus,
        }}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleExportCSV()}>
              <FileText className="mr-2 h-4 w-4" />
              Exportar CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExportPDF()}>
              <File className="mr-2 h-4 w-4" />
              Exportar PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
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
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 gap-0">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle>
              {selectedTitulo ? "Editar Título" : "Novo Título"}
            </DialogTitle>
            <DialogDescription>
              {selectedTitulo
                ? "Altere os dados do título financeiro"
                : "Crie um novo título financeiro"}
            </DialogDescription>
          </DialogHeader>

          <ApiErrorAlert error={apiError} className="px-6" />

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Coluna da Esquerda: Dados Básicos */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="licenca">Licença / Cliente</Label>
                  <Select
                    value={formData.licencaId}
                    onValueChange={(value) => {
                      setFormData({ ...formData, licencaId: value });
                      // Se estiver vinculado, atualizar datas ao mudar licença
                      if (formData.vincularLicenca) {
                        const licenca = licencas.find((l) => l.id === value);
                        if (licenca) {
                          setFormData((prev) => ({
                            ...prev,
                            licencaId: value,
                            periodoCobrancaInicio: new Date()
                              .toISOString()
                              .split("T")[0],
                            periodoCobrancaFim:
                              licenca.dataExpiracao.split("T")[0],
                          }));
                        }
                      }
                    }}
                    disabled={!!selectedTitulo}
                  >
                    <SelectTrigger className="h-11">
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
                    className="h-11"
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
                      className="h-11 font-medium"
                    />
                  </div>

                  {formData.recorrente === false &&
                    formData.vincularLicenca === false && (
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
                          className="h-11"
                        />
                      </div>
                    )}
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
                    <SelectTrigger className="h-11">
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

              {/* Coluna da Direita: Configurações Avançadas */}
              <div className="space-y-6 border-l pl-8 border-border/50">
                {/* Card Recorrente */}
                <div
                  className={`rounded-xl border transition-all duration-200 ${
                    formData.recorrente
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div className="p-4 flex items-start gap-3">
                    <Checkbox
                      id="recorrente"
                      checked={formData.recorrente}
                      onCheckedChange={(checked) =>
                        handleRecorrenteChange(!!checked)
                      }
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <label
                        htmlFor="recorrente"
                        className="text-sm font-semibold leading-none flex items-center gap-2 cursor-pointer"
                      >
                        <Repeat className="h-4 w-4 text-primary" /> Título
                        Recorrente
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Gerar várias parcelas automaticamente
                      </p>
                    </div>
                  </div>

                  {formData.recorrente && (
                    <div className="p-4 pt-0 space-y-4 animate-in fade-in slide-in-from-top-2">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-xs">Periodicidade</Label>
                          <Select
                            value={formData.periodicidade}
                            onValueChange={(value) =>
                              setFormData({
                                ...formData,
                                periodicidade: value as Periodicidade,
                              })
                            }
                          >
                            <SelectTrigger className="h-9 bg-background">
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="MENSAL">Mensal</SelectItem>
                              <SelectItem value="TRIMESTRAL">
                                Trimestral
                              </SelectItem>
                              <SelectItem value="SEMESTRAL">
                                Semestral
                              </SelectItem>
                              <SelectItem value="ANUAL">Anual</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {formData.periodicidade === "MENSAL" && (
                          <div className="space-y-2">
                            <Label className="text-xs">Qtd. Meses</Label>
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
                              className="h-9 bg-background"
                            />
                          </div>
                        )}
                      </div>

                      {/* Exibir datas de cobertura para não-mensais */}
                      {formData.periodicidade !== "MENSAL" && (
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-2">
                            <Label className="text-xs">Início do Período</Label>
                            <Input
                              type="date"
                              value={formData.periodoCobrancaInicio || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  periodoCobrancaInicio: e.target.value,
                                })
                              }
                              className="h-9 bg-background"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-xs">Fim do Período</Label>
                            <Input
                              type="date"
                              value={formData.periodoCobrancaFim || ""}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  periodoCobrancaFim: e.target.value,
                                })
                              }
                              className="h-9 bg-background"
                            />
                          </div>
                        </div>
                      )}

                      {formData.periodicidade === "MENSAL" && (
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="usarDiaPadrao"
                            checked={usarDiaPadrao}
                            onCheckedChange={(checked) =>
                              setUsarDiaPadrao(!!checked)
                            }
                          />
                          <Label
                            htmlFor="usarDiaPadrao"
                            className="text-sm cursor-pointer"
                          >
                            Usar dia padrão de cobrança
                          </Label>
                        </div>
                      )}

                      {formData.periodicidade === "MENSAL" && usarDiaPadrao && (
                        <div className="space-y-2">
                          <Label className="text-xs">Dia Padrão</Label>
                          <Input
                            type="number"
                            min={1}
                            max={31}
                            value={formData.diaVencimentoPadrao || ""}
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                diaVencimentoPadrao: parseInt(e.target.value),
                              })
                            }
                            placeholder="Ex: 10"
                            className="h-9 bg-background"
                          />
                        </div>
                      )}

                      {parcelasPreview.length > 0 && (
                        <div className="space-y-2 pt-2">
                          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            Previsão de Parcelas
                          </Label>
                          <div className="max-h-[180px] overflow-y-auto border rounded-lg bg-background shadow-inner">
                            {parcelasPreview.map((parcela, index) => (
                              <div
                                key={index}
                                className="flex items-center gap-3 p-2 border-b last:border-0 text-sm hover:bg-muted/50 transition-colors"
                              >
                                <span className="w-6 text-xs font-mono text-muted-foreground text-center">
                                  {index + 1}º
                                </span>
                                <Input
                                  type="date"
                                  value={parcela.dataVencimento}
                                  onChange={(e) =>
                                    handleUpdateParcelaDate(
                                      index,
                                      e.target.value
                                    )
                                  }
                                  className="h-7 w-32 text-xs"
                                />
                                <span className="font-medium ml-auto text-xs">
                                  R${" "}
                                  {parcela.valor.toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Vincular Licença */}
                <div
                  className={`rounded-xl border transition-all duration-200 ${
                    formData.vincularLicenca
                      ? "bg-primary/5 border-primary/20 shadow-sm"
                      : "bg-card border-border hover:border-primary/20"
                  }`}
                >
                  <div className="p-4 flex items-start gap-3">
                    <Checkbox
                      id="vincularLicenca"
                      checked={formData.vincularLicenca}
                      onCheckedChange={(checked) =>
                        handleVincularLicencaChange(!!checked)
                      }
                      className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none flex-1">
                      <label
                        htmlFor="vincularLicenca"
                        className="text-sm font-semibold leading-none flex items-center gap-2 cursor-pointer"
                      >
                        <Calendar className="h-4 w-4 text-primary" /> Vincular à
                        Licença
                      </label>
                      <p className="text-xs text-muted-foreground">
                        Usar tempo de expiração da licença
                      </p>
                    </div>
                  </div>

                  {formData.vincularLicenca && (
                    <div className="p-4 pt-0 grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2">
                        <Label className="text-xs">Início da Cobrança</Label>
                        <Input
                          type="date"
                          value={formData.periodoCobrancaInicio || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              periodoCobrancaInicio: e.target.value,
                            })
                          }
                          className="h-9 bg-background"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Fim da Cobrança</Label>
                        <Input
                          type="date"
                          value={formData.periodoCobrancaFim || ""}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              periodoCobrancaFim: e.target.value,
                            })
                          }
                          className="h-9 bg-background"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 border-t bg-muted/10 flex items-center justify-between sm:justify-between">
            <div className="flex items-center space-x-2">
              {!selectedTitulo && (
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="criarOutro"
                    checked={criarOutro}
                    onCheckedChange={(c) => setCriarOutro(!!c)}
                  />
                  <label
                    htmlFor="criarOutro"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    Criar outro após salvar
                  </label>
                </div>
              )}
            </div>
            <div className="flex gap-2">
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
          </DialogFooter>
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
