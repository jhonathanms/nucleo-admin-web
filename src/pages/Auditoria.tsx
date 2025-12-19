import { useState, useEffect, useCallback } from "react";
import { ClipboardList, Filter, Download } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
import { LogAuditoria, NivelAuditoria } from "@/types/auditoria.types";

const acaoLabels: Record<string, string> = {
  CREATE: "Criação",
  UPDATE: "Alteração",
  DELETE: "Exclusão",
  LOGIN: "Login",
  LOGIN_FAILED: "Login Falhou",
  LOGOUT: "Logout",
  BACKUP: "Backup",
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

const nivelVariants: Record<string, "secondary" | "outline" | "destructive"> = {
  INFO: "secondary",
  WARNING: "outline",
  ERROR: "destructive",
};

const statusBadgeVariants: Record<string, "info" | "warning" | "destructive"> =
  {
    INFO: "info",
    WARNING: "warning",
    ERROR: "destructive",
  };

export default function Auditoria() {
  const [logs, setLogs] = useState<LogAuditoria[]>([]);
  const [totalLogs, setTotalLogs] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [filtroEntidade, setFiltroEntidade] = useState<string>("todos");
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");
  const [selectedLog, setSelectedLog] = useState<LogAuditoria | null>(null);
  const { toast } = useToast();

  const loadLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = { size: 100 }; // Updated to 100 as requested
      if (filtroEntidade !== "todos") params.entidade = filtroEntidade;
      if (filtroNivel !== "todos") params.nivel = filtroNivel;
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
  }, [filtroEntidade, filtroNivel, dataInicio, dataFim, toast]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

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
          variant={log.nivel ? statusBadgeVariants[log.nivel] : "info"}
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
    <div className="space-y-6">
      <PageHeader
        title="Auditoria"
        description="Histórico de ações no sistema"
        icon={ClipboardList}
      >
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Entidade</Label>
                <Select
                  value={filtroEntidade}
                  onValueChange={setFiltroEntidade}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Todas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas</SelectItem>
                    <SelectItem value="CLIENTE">Cliente</SelectItem>
                    <SelectItem value="PRODUTO">Produto</SelectItem>
                    <SelectItem value="PLANO">Plano</SelectItem>
                    <SelectItem value="LICENCA">Licença</SelectItem>
                    <SelectItem value="USUARIO">Usuário</SelectItem>
                    <SelectItem value="TITULO">Título</SelectItem>
                    <SelectItem value="AUTH">Autenticação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Nível</Label>
                <Select value={filtroNivel} onValueChange={setFiltroNivel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Todos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="INFO">Info</SelectItem>
                    <SelectItem value="WARNING">Warning</SelectItem>
                    <SelectItem value="ERROR">Error</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  setFiltroEntidade("todos");
                  setFiltroNivel("todos");
                  setDataInicio("");
                  setDataFim("");
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </PopoverContent>
        </Popover>

        <Button variant="outline" className="gap-2">
          <Download className="h-4 w-4" />
          Exportar
        </Button>
      </PageHeader>

      {/* Summary cards - Simplified for now as we don't have aggregated stats endpoint */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Logs</p>
          <p className="text-2xl font-bold">{totalLogs}</p>
        </div>
        {/* 
          Placeholder for other stats if backend provides aggregation later.
          For now, we only show total logs found by current filter.
        */}
      </div>

      <DataTable
        data={logs}
        columns={columns}
        searchKey="detalhes"
        searchPlaceholder="Buscar nos detalhes..."
        itemsPerPage={100}
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
              <Badge
                variant={
                  selectedLog?.nivel
                    ? nivelVariants[selectedLog.nivel]
                    : "secondary"
                }
              >
                {selectedLog?.nivel || "INFO"}
              </Badge>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {selectedLog && new Date(selectedLog.dataHora).toLocaleString()}
              </span>
            </div>
            <DialogTitle className="text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              {selectedLog &&
                (acaoLabels[selectedLog.acao] || selectedLog.acao)}
            </DialogTitle>
            <DialogDescription>
              Detalhes completos do registro de auditoria #
              {selectedLog?.id.substring(0, 8)}
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
