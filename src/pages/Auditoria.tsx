import { useState, useEffect } from "react";
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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
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

const nivelVariants: Record<string, "info" | "warning" | "destructive"> = {
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
  const { toast } = useToast();

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const params: any = { size: 20 }; // Default page size
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
  };

  useEffect(() => {
    loadLogs();
  }, [filtroEntidade, filtroNivel, dataInicio, dataFim]);

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
          <p className="text-sm font-medium">{log.usuario}</p>
          <p className="text-xs text-muted-foreground">{log.usuarioEmail}</p>
        </div>
      ),
    },
    {
      key: "acao",
      header: "Ação",
      cell: (log) => (
        <StatusBadge
          status={acaoLabels[log.acao] || log.acao}
          variant={nivelVariants[log.nivel] || "default"}
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
      />
    </div>
  );
}
