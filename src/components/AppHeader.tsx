import { useState, useEffect, useCallback } from "react";
import { Bell, Search, X, Check, Trash2, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import clienteService from "@/services/cliente.service";
import produtoService from "@/services/produto.service";
import planoService from "@/services/plano.service";
import usuarioService from "@/services/usuario.service";
import notificacaoService, {
  Notificacao,
} from "@/services/notificacao.service";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
}

interface SearchResult {
  id: string;
  title: string;
  type: "Cliente" | "Produto" | "Plano" | "Usuário";
  link: string;
}

export function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<Notificacao | null>(null);
  const [notifFilter, setNotifFilter] = useState<"todas" | "nao_lidas">(
    "nao_lidas"
  );
  const [isAllNotifsOpen, setIsAllNotifsOpen] = useState(false);
  const navigate = useNavigate();

  // Load Notifications
  const loadNotificacoes = useCallback(async () => {
    const data = await notificacaoService.getAll();
    setNotificacoes(data);
  }, []);

  useEffect(() => {
    loadNotificacoes();
    const interval = setInterval(loadNotificacoes, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [loadNotificacoes]);

  // Global Search with Debounce
  useEffect(() => {
    if (searchTerm.length < 2) {
      setResults([]);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setIsSearching(true);
      try {
        const [clientes, produtos, planos, usuarios] = await Promise.all([
          clienteService.getAll({ size: 5, q: searchTerm }),
          produtoService.getAll({ size: 5, q: searchTerm }),
          planoService.getAll({ size: 5, q: searchTerm }),
          usuarioService.getAll({ size: 5, q: searchTerm }),
        ]);

        const combined: SearchResult[] = [
          ...clientes.content.map((c) => ({
            id: c.id,
            title: c.nome,
            type: "Cliente" as const,
            link: `/clientes?id=${c.id}`,
          })),
          ...produtos.content.map((p) => ({
            id: p.id,
            title: p.nome,
            type: "Produto" as const,
            link: `/produtos?id=${p.id}`,
          })),
          ...planos.content.map((pl) => ({
            id: pl.id,
            title: pl.nome,
            type: "Plano" as const,
            link: `/planos?id=${pl.id}`,
          })),
          ...usuarios.content.map((u) => ({
            id: u.id,
            title: u.nome,
            type: "Usuário" as const,
            link: `/usuarios?id=${u.id}`,
          })),
        ];

        setResults(
          combined.filter((r) =>
            r.title.toLowerCase().includes(searchTerm.toLowerCase())
          )
        );
      } catch (error) {
        console.error("Search failed", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleSelectResult = (link: string) => {
    setSearchTerm("");
    setResults([]);
    navigate(link);
  };

  const highlightText = (text: string, highlight: string) => {
    const parts = text.split(new RegExp(`(${highlight})`, "gi"));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === highlight.toLowerCase() ? (
            <mark
              key={i}
              className="bg-yellow-200 text-black rounded-sm px-0.5"
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  const unreadCount = Array.isArray(notificacoes)
    ? notificacoes.filter((n) => !n.lida).length
    : 0;
  const filteredNotifs = Array.isArray(notificacoes)
    ? notifFilter === "nao_lidas"
      ? notificacoes.filter((n) => !n.lida)
      : notificacoes
    : [];

  const handleMarkAllAsRead = async () => {
    if (!Array.isArray(notificacoes)) return;
    const unread = notificacoes.filter((n) => !n.lida);
    await Promise.all(
      unread.map((n) => notificacaoService.marcarComoLida(n.id))
    );
    loadNotificacoes();
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm transition-all duration-300"
      style={{ left: sidebarCollapsed ? "4rem" : "16rem" }}
    >
      <div className="flex h-full items-center justify-between px-6">
        {/* Global Search */}
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Pesquisar cliente, produto, plano..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {results.length > 0 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-lg shadow-xl overflow-hidden z-50">
              <div className="max-h-[400px] overflow-y-auto p-2">
                {results.map((result) => (
                  <button
                    key={`${result.type}-${result.id}`}
                    onClick={() => handleSelectResult(result.link)}
                    className="w-full flex items-center justify-between p-3 hover:bg-muted rounded-md transition-colors text-left"
                  >
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">
                        {highlightText(result.title, searchTerm)}
                      </span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                        {result.type}
                      </span>
                    </div>
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}
          {searchTerm.length >= 2 && results.length === 0 && !isSearching && (
            <div className="absolute top-full left-0 w-full mt-2 bg-card border border-border rounded-lg p-4 text-center text-sm text-muted-foreground shadow-xl">
              Nenhum resultado encontrado para "{searchTerm}"
            </div>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Notifications Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h3 className="font-bold text-sm">Notificações</h3>
                <div className="flex gap-1">
                  <Button
                    variant={notifFilter === "nao_lidas" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setNotifFilter("nao_lidas")}
                  >
                    Não lidas
                  </Button>
                  <Button
                    variant={notifFilter === "todas" ? "default" : "ghost"}
                    size="sm"
                    className="h-7 text-[10px] px-2"
                    onClick={() => setNotifFilter("todas")}
                  >
                    Todas
                  </Button>
                </div>
              </div>
              <div className="max-h-[350px] overflow-y-auto">
                {filteredNotifs.length === 0 ? (
                  <div className="p-8 text-center text-sm text-muted-foreground">
                    Nenhuma notificação encontrada
                  </div>
                ) : (
                  filteredNotifs.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        "p-4 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors relative group",
                        !n.lida && "bg-primary/5"
                      )}
                      onClick={() => setSelectedNotif(n)}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="text-xs font-bold">{n.titulo}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(n.dataCriacao).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2 pr-4">
                        {n.mensagem}
                      </p>
                      {!n.lida && (
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 w-2 h-2 bg-primary rounded-full"></div>
                      )}
                    </div>
                  ))
                )}
              </div>
              <DropdownMenuSeparator />
              <div className="p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => setIsAllNotifsOpen(true)}
                >
                  Ver todas as notificações
                </Button>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Modal: Todas as Notificações */}
      <Dialog open={isAllNotifsOpen} onOpenChange={setIsAllNotifsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle>Central de Notificações</DialogTitle>
              {unreadCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs h-8"
                >
                  Marcar todas como lidas
                </Button>
              )}
            </div>
            <DialogDescription>
              Gerencie todos os alertas e avisos do sistema.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            <div className="space-y-4">
              {!Array.isArray(notificacoes) || notificacoes.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  Nenhuma notificação registrada.
                </div>
              ) : (
                notificacoes.map((n) => (
                  <div
                    key={n.id}
                    className={cn(
                      "p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer relative",
                      !n.lida && "bg-primary/5 border-primary/20"
                    )}
                    onClick={() => {
                      setSelectedNotif(n);
                      setIsAllNotifsOpen(false);
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            n.tipo === "ERRO" ? "destructive" : "secondary"
                          }
                          className="text-[10px] px-1.5 h-5"
                        >
                          {n.tipo}
                        </Badge>
                        <span className="font-bold text-sm">{n.titulo}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(n.dataCriacao).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {n.mensagem}
                    </p>
                    {!n.lida && (
                      <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-8 bg-primary rounded-full"></div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="p-4 border-t border-border bg-muted/20">
            <Button variant="ghost" onClick={() => setIsAllNotifsOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Detail Modal */}
      <Dialog
        open={!!selectedNotif}
        onOpenChange={(open) => !open && setSelectedNotif(null)}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <div className="flex items-center justify-between mb-2">
              <Badge
                variant={
                  selectedNotif?.tipo === "ERRO" ? "destructive" : "secondary"
                }
              >
                {selectedNotif?.tipo}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {selectedNotif &&
                  new Date(selectedNotif.dataCriacao).toLocaleString()}
              </span>
            </div>
            <DialogTitle>{selectedNotif?.titulo}</DialogTitle>
            <DialogDescription className="pt-4 text-foreground">
              {selectedNotif?.mensagem}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex sm:justify-between gap-2 mt-6">
            <Button
              variant="destructive"
              size="sm"
              className="gap-2"
              onClick={async () => {
                if (selectedNotif) {
                  await notificacaoService.excluir(selectedNotif.id);
                  loadNotificacoes();
                  setSelectedNotif(null);
                }
              }}
            >
              <Trash2 className="h-4 w-4" /> Excluir
            </Button>
            <div className="flex gap-2">
              {!selectedNotif?.lida && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-2"
                  onClick={async () => {
                    if (selectedNotif) {
                      await notificacaoService.marcarComoLida(selectedNotif.id);
                      loadNotificacoes();
                      setSelectedNotif(null);
                    }
                  }}
                >
                  <Check className="h-4 w-4" /> Marcar como lida
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                onClick={() => setSelectedNotif(null)}
              >
                Fechar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
