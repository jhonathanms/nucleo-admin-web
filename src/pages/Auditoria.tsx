import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Filter, Download, FileText, File } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { DataTable, Column } from "@/components/DataTable";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Eye,
  Clock,
  User,
  Globe,
  Activity,
  Database,
  ShieldAlert,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import auditoriaService from "@/services/auditoria.service";
import { LogAuditoria } from "@/types/auditoria.types";

const acaoLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGIN_FAILED: "Login Falhou",
  LOGOUT: "Logout",
  BACKUP: "Backup",
};

const acaoVariants: Record<
  string,
  "success" | "warning" | "destructive" | "info" | "muted" | "default"
> = {
  CREATE: "success",
  UPDATE: "warning",
  DELETE: "destructive",
  LOGIN: "info",
  LOGIN_FAILED: "destructive",
  LOGOUT: "muted",
  BACKUP: "default",
};

const entidadeLabels: Record<string, string> = {
  CLIENTE: "Cliente",
  PRODUTO: "Produto",
  PLANO: "Plano",
  LICENCA: "Licença",
  USUARIO: "Usuário",
  TITULO: "Título",
  AUTH: "Autenticação",
  SISTEMA: "Sistema",
};

export default function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroEntidade, setFiltroEntidade] = useState<string>("todos");
  const [filtroAcao, setFiltroAcao] = useState<string>("TODOS");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { size: 200 };
      if (filtroEntidade !== "todos") params.entidade = filtroEntidade;
      if (filtroAcao !== "TODOS") params.acao = filtroAcao;
      if (dataInicio) params.dataInicio = dataInicio;
      if (dataFim) params.dataFim = dataFim;

      const response = await auditoriaService.getAll(params);
      setLogs(response.content);
      setTotalLogs(response.totalElements);
    } catch (error) {
      console.error("Erro ao carregar logs:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs de auditoria.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [filtroEntidade, filtroAcao, dataInicio, dataFim, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const handleExportCSV = () => {
    if (logs.length === 0) {
      toast({
        title: "Sem dados",
        description: "Não há dados para exportar.",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Data/Hora",
      "Usuário",
      "Ação",
      "Entidade",
      "ID Entidade",
      "Detalhes",
      "IP",
    ];

    const csvContent = [
      headers.join(";"),
      ...logs.map((log) => {
        return [
          new Date(log.dataHora).toLocaleString("pt-BR"),
          log.usuarioNome,
          acaoLabels[log.acao] || log.acao,
          entidadeLabels[log.entidade] || log.entidade,
          log.entidadeId,
          `"${log.detalhes.replace(/"/g, '""')}"`,
          log.ip,
        ].join(";");
      }),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `auditoria_export_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (logs.length === 0) {
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
          <title>Relatório de Auditoria</title>
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
            .badge-info { background: #e0f2fe; color: #0369a1; }
            .badge-muted { background: #f3f4f6; color: #374151; }
            .badge-default { background: #f3f4f6; color: #374151; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="title">Relatório de Auditoria</div>
              <div class="subtitle">Núcleo Admin - Sistema de Gestão</div>
            </div>
            <div style="text-align: right; font-size: 12px;">
              <p>Gerado em: ${new Date().toLocaleString("pt-BR")}</p>
              <p>Registros: ${logs.length}</p>
            </div>
          </div>
          
          <table>
            <thead>
              <tr>
                <th width="15%">Data/Hora</th>
                <th width="15%">Usuário</th>
                <th width="10%">Ação</th>
                <th width="10%">Entidade</th>
                <th width="50%">Detalhes</th>
              </tr>
            </thead>
            <tbody>
              ${logs
                .map((log) => {
                  const variant = acaoVariants[log.acao] || "default";
                  const badgeClass = `badge-${variant}`;

                  return `
                  <tr>
                    <td>${new Date(log.dataHora).toLocaleString("pt-BR")}</td>
                    <td>${log.usuarioNome}</td>
                    <td><span class="badge ${badgeClass}">${
                    acaoLabels[log.acao] || log.acao
                  }</span></td>
                    <td>${entidadeLabels[log.entidade] || log.entidade}</td>
                    <td>${log.detalhes}</td>
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

  const columns: Column<LogAuditoria>[] = [
    {
      key: "timestamp",
      header: "Data/Hora",
      cell: (log) => (
        <span className="text-sm font-mono">
          {new Date(log.dataHora).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "medium",
          })}
        </span>
      ),
    },
    {
      key: "usuario",
      header: "Usuário",
      cell: (log) => (
        <div>
          <p className="text-sm font-medium">{log.usuarioNome}</p>
          <p className="text-xs text-muted-foreground font-mono">
            {log.usuarioId.substring(0, 8)}...
          </p>
        </div>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      cell: (log) => (
        <StatusBadge
          status={acaoLabels[log.acao] || log.acao}
          variant={acaoVariants[log.acao] || "default"}
        />
      ),
    },
    {
      key: "entidade",
      header: "Entidade",
      cell: (log) => (
        <div>
          <p className="text-sm">
            {entidadeLabels[log.entidade] || log.entidade}
          </p>
          <p className="text-xs text-muted-foreground font-mono">
            {log.entidadeId}
          </p>
        </div>
      ),
    },
    {
      key: "detalhes",
      header: "Detalhes",
      cell: (log) => (
        <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">
          {log.detalhes}
        </span>
      ),
    },
    {
      key: "userAgent",
      header: "Navegador/Sistema",
      cell: (log) => (
        <span
          className="text-sm text-muted-foreground line-clamp-1 max-w-[200px]"
          title={log.userAgent}
        >
          {log.userAgent}
        </span>
      ),
    },
    {
      key: "ip",
      header: "IP",
      cell: (log) => (
        <span className="text-sm font-mono text-muted-foreground">
          {log.ip}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <PageHeader
        title="Auditoria"
        description="Registro de atividades e logs do sistema"
        icon={ShieldAlert}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 shrink-0">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Logs</p>
          <p className="text-2xl font-bold">{totalLogs}</p>
        </div>
      </div>

      {/* Filters in one row */}
      <div className="flex gap-2 items-center shrink-0">
        <Select value={filtroAcao} onValueChange={setFiltroAcao}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas Ações</SelectItem>
            <SelectItem value="LOGIN">Login</SelectItem>
            <SelectItem value="LOGOUT">Logout</SelectItem>
            <SelectItem value="CRIAR">Criação</SelectItem>
            <SelectItem value="ATUALIZAR">Atualização</SelectItem>
            <SelectItem value="EXCLUIR">Exclusão</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Entidade" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="TODOS">Todas</SelectItem>
            <SelectItem value="USUARIO">Usuário</SelectItem>
            <SelectItem value="CLIENTE">Cliente</SelectItem>
            <SelectItem value="PRODUTO">Produto</SelectItem>
            <SelectItem value="LICENCA">Licença</SelectItem>
            <SelectItem value="TITULO">Título</SelectItem>
            <SelectItem value="AUTH">Auth</SelectItem>
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Data
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Data Fim</Label>
                  <Input
                    type="date"
                    value={dataFim}
                    onChange={(e) => setDataFim(e.target.value)}
                  />
                </div>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setDataInicio("");
                  setDataFim("");
                }}
              >
                Limpar Datas
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setFiltroEntidade("TODOS");
            setFiltroAcao("TODOS");
            setDataInicio("");
            setDataFim("");
          }}
        >
          Limpar Filtros
        </Button>
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchKey="detalhes"
        searchPlaceholder="Buscar nos detalhes..."
        itemsPerPage={20}
        actions={[
          {
            label: "Ver Detalhes",
            icon: Eye,
            onClick: (log) => setSelectedLog(log),
          },
        ]}
      />

      <Dialog
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      >
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <StatusBadge
                status={
                  selectedLog
                    ? acaoLabels[selectedLog.acao] || selectedLog.acao
                    : ""
                }
                variant={
                  selectedLog
                    ? acaoVariants[selectedLog.acao] || "default"
                    : "default"
                }
              />
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedLog && new Date(selectedLog.dataHora).toLocaleString()}
              </span>
            </div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Detalhes da Auditoria
            </DialogTitle>
            <DialogDescription>
              Registro #{selectedLog?.id.substring(0, 8)}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-6 py-4">
            {/* User Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1">
                <User className="h-4 w-4 text-muted-foreground" /> Usuário
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    Nome
                  </p>
                  <p className="text-sm font-medium">
                    {selectedLog?.usuarioNome}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    ID do Usuário
                  </p>
                  <p className="text-sm font-mono">{selectedLog?.usuarioId}</p>
                </div>
              </div>
            </div>

            {/* Entity Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1">
                <Database className="h-4 w-4 text-muted-foreground" /> Entidade
                Afetada
              </h4>
              <div className="grid grid-cols-2 gap-4 bg-muted/30 p-3 rounded-lg">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    Tipo
                  </p>
                  <p className="text-sm font-medium">
                    {selectedLog &&
                      (entidadeLabels[selectedLog.entidade] ||
                        selectedLog.entidade)}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    ID da Entidade
                  </p>
                  <p className="text-sm font-mono">{selectedLog?.entidadeId}</p>
                </div>
              </div>
            </div>

            {/* Technical Info */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1">
                <Globe className="h-4 w-4 text-muted-foreground" /> Origem
              </h4>
              <div className="space-y-3 bg-muted/30 p-3 rounded-lg">
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    Endereço IP
                  </p>
                  <p className="text-sm font-mono">{selectedLog?.ip}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase text-muted-foreground font-bold">
                    User Agent
                  </p>
                  <p className="text-xs text-muted-foreground break-all bg-background/50 p-2 rounded mt-1 border border-border/50">
                    {selectedLog?.userAgent}
                  </p>
                </div>
              </div>
            </div>

            {/* Details/Payload */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2 border-b pb-1">
                <ShieldAlert className="h-4 w-4 text-muted-foreground" />{" "}
                Detalhes da Ação
              </h4>
              <div className="bg-muted/50 p-4 rounded-lg border border-border">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">
                  {selectedLog?.detalhes}
                </p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedLog(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
