import { useState } from "react";
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

interface LogAuditoria {
  id: string;
  timestamp: string;
  usuario: string;
  usuarioEmail: string;
  acao: string;
  entidade: string;
  entidadeId: string;
  detalhes: string;
  ip: string;
  nivel: "INFO" | "WARNING" | "ERROR";
}

const mockLogs: LogAuditoria[] = [
  { id: "1", timestamp: "2024-03-15T10:30:45", usuario: "Admin Sistema", usuarioEmail: "admin@sistema.com", acao: "CREATE", entidade: "LICENCA", entidadeId: "LIC-001", detalhes: "Nova licença criada para Tech Solutions", ip: "192.168.1.100", nivel: "INFO" },
  { id: "2", timestamp: "2024-03-15T10:25:30", usuario: "Admin Sistema", usuarioEmail: "admin@sistema.com", acao: "UPDATE", entidade: "CLIENTE", entidadeId: "CLI-001", detalhes: "Status alterado de ATIVO para SUSPENSO", ip: "192.168.1.100", nivel: "WARNING" },
  { id: "3", timestamp: "2024-03-15T10:20:15", usuario: "Suporte Técnico", usuarioEmail: "suporte@sistema.com", acao: "UPDATE", entidade: "USUARIO", entidadeId: "USR-003", detalhes: "Senha resetada para carlos@techsolutions.com", ip: "192.168.1.101", nivel: "WARNING" },
  { id: "4", timestamp: "2024-03-15T10:15:00", usuario: "Carlos Silva", usuarioEmail: "carlos@techsolutions.com", acao: "LOGIN", entidade: "AUTH", entidadeId: "-", detalhes: "Login bem-sucedido", ip: "200.150.100.50", nivel: "INFO" },
  { id: "5", timestamp: "2024-03-15T10:10:30", usuario: "Sistema", usuarioEmail: "sistema@interno", acao: "UPDATE", entidade: "TITULO", entidadeId: "FAT-004", detalhes: "Status alterado para EM_ATRASO automaticamente", ip: "127.0.0.1", nivel: "WARNING" },
  { id: "6", timestamp: "2024-03-15T09:55:20", usuario: "Admin Sistema", usuarioEmail: "admin@sistema.com", acao: "DELETE", entidade: "PLANO", entidadeId: "PLN-007", detalhes: "Plano 'Legacy Basic' removido", ip: "192.168.1.100", nivel: "WARNING" },
  { id: "7", timestamp: "2024-03-15T09:45:10", usuario: "Fernanda Lima", usuarioEmail: "fernanda@digitalcorp.com", acao: "LOGIN_FAILED", entidade: "AUTH", entidadeId: "-", detalhes: "Tentativa de login com senha incorreta (3x)", ip: "200.150.100.75", nivel: "ERROR" },
  { id: "8", timestamp: "2024-03-15T09:30:00", usuario: "Sistema", usuarioEmail: "sistema@interno", acao: "CREATE", entidade: "TITULO", entidadeId: "FAT-008", detalhes: "Fatura mensal gerada automaticamente", ip: "127.0.0.1", nivel: "INFO" },
  { id: "9", timestamp: "2024-03-15T09:15:45", usuario: "Admin Sistema", usuarioEmail: "admin@sistema.com", acao: "UPDATE", entidade: "LICENCA", entidadeId: "LIC-004", detalhes: "Licença suspensa por inadimplência", ip: "192.168.1.100", nivel: "WARNING" },
  { id: "10", timestamp: "2024-03-15T09:00:00", usuario: "Sistema", usuarioEmail: "sistema@interno", acao: "BACKUP", entidade: "SISTEMA", entidadeId: "-", detalhes: "Backup automático concluído com sucesso", ip: "127.0.0.1", nivel: "INFO" },
];

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
  const [logs] = useState<LogAuditoria[]>(mockLogs);
  const [filtroEntidade, setFiltroEntidade] = useState<string>("todos");
  const [filtroNivel, setFiltroNivel] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFim, setDataFim] = useState<string>("");

  const logsFiltrados = logs.filter(log => {
    if (filtroEntidade !== "todos" && log.entidade !== filtroEntidade) return false;
    if (filtroNivel !== "todos" && log.nivel !== filtroNivel) return false;
    return true;
  });

  const columns: Column<LogAuditoria>[] = [
    {
      key: "timestamp",
      header: "Data/Hora",
      cell: (log) => (
        <span className="text-sm font-mono">
          {new Date(log.timestamp).toLocaleString("pt-BR", {
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
          variant={nivelVariants[log.nivel]}
        />
      ),
    },
    {
      key: "entidade",
      header: "Entidade",
      cell: (log) => (
        <div>
          <p className="text-sm">{entidadeLabels[log.entidade] || log.entidade}</p>
          <p className="text-xs text-muted-foreground font-mono">{log.entidadeId}</p>
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
        <span className="text-sm font-mono text-muted-foreground">{log.ip}</span>
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
                <Select value={filtroEntidade} onValueChange={setFiltroEntidade}>
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

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Total de Logs</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Informativo</p>
          <p className="text-2xl font-bold text-info">
            {logs.filter(l => l.nivel === "INFO").length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Alertas</p>
          <p className="text-2xl font-bold text-warning">
            {logs.filter(l => l.nivel === "WARNING").length}
          </p>
        </div>
        <div className="rounded-lg border border-border bg-card p-4">
          <p className="text-sm text-muted-foreground">Erros</p>
          <p className="text-2xl font-bold text-destructive">
            {logs.filter(l => l.nivel === "ERROR").length}
          </p>
        </div>
      </div>

      <DataTable
        data={logsFiltrados}
        columns={columns}
        searchKey="detalhes"
        searchPlaceholder="Buscar nos detalhes..."
      />
    </div>
  );
}
