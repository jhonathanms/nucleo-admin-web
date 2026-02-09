import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import authService from "@/services/auth.service";
import { User } from "@/types/auth.types";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import {
  LayoutDashboard,
  Users,
  Package,
  CreditCard,
  Key,
  UserCircle,
  DollarSign,
  ClipboardList,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2,
  LogOut,
} from "lucide-react";
import { UserAvatar } from "./UserAvatar";
import clienteService from "@/services/cliente.service";
import { Cliente } from "@/types/cliente.types";
import { ClienteLogo } from "./ClienteLogo";
import { useUser } from "@/contexts/UserContext";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Clientes", href: "/clientes", icon: Building2 },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Planos", href: "/planos", icon: CreditCard },
  { name: "Licenças", href: "/licencas", icon: Key },
  { name: "Usuários", href: "/usuarios", icon: UserCircle },
  { name: "Financeiro", href: "/financeiro", icon: DollarSign },
  { name: "Auditoria", href: "/auditoria", icon: ClipboardList },
  { name: "Configurações", href: "/configuracoes", icon: Settings },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, avatarRefreshKey } = useUser();
  const [isLogoutConfirmOpen, setIsLogoutConfirmOpen] = useState(false);
  const [mainCliente, setMainCliente] = useState<Cliente | null>(null);

  useEffect(() => {
    loadMainCliente();
  }, []);

  const loadMainCliente = async () => {
    try {
      const response = await clienteService.getAll({ size: 1 });
      if (response.content && response.content.length > 0) {
        setMainCliente(response.content[0]);
      }
    } catch (error) {
      console.error("Erro ao carregar cliente principal:", error);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout failed:", error);
      navigate("/login", { replace: true }); // Force redirect even if logout fails
    }
  };

  return (
    <aside
      className={cn(
        "fixed left-4 top-4 bottom-4 z-40 transition-all duration-300 ease-in-out",
        "bg-sidebar/95 backdrop-blur-xl border border-sidebar-border/50 shadow-[0_8px_32px_rgba(0,0,0,0.12)] rounded-3xl overflow-hidden",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="flex h-full flex-col">
        {/* Logo Section */}
        <div className="flex h-20 items-center justify-between px-6">
          {!collapsed ? (
            <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-lg"></div>
                <img
                  src="/logo.png"
                  alt="Nucleo Admin"
                  className="relative h-9 w-9 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold tracking-tight text-sidebar-foreground leading-none">
                  Núcleo Admin
                </span>
                <span className="text-[10px] font-medium uppercase tracking-widest text-primary mt-1">
                  Sistema de Gestão
                </span>
              </div>
            </div>
          ) : (
            <div className="mx-auto">
              <img
                src="/logo.png"
                alt="Logo"
                className="h-8 w-8 object-contain"
              />
            </div>
          )}
        </div>
        {/* Navigation */}
        <ScrollArea className="flex-1 px-4 py-2">
          <nav className="space-y-1.5">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                    collapsed && "justify-center px-0 h-12 w-12 mx-auto"
                  )}
                >
                  <item.icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110",
                      isActive
                        ? "text-primary-foreground"
                        : "text-sidebar-foreground/50 group-hover:text-primary"
                    )}
                  />
                  {!collapsed && (
                    <span className="relative z-10">{item.name}</span>
                  )}
                  {isActive && !collapsed && (
                    <div className="absolute right-2 h-1.5 w-1.5 rounded-full bg-primary-foreground/50" />
                  )}

                  {/* Tooltip for collapsed state */}
                  {collapsed && (
                    <div className="absolute left-full ml-4 px-2 py-1 bg-sidebar-foreground text-sidebar-background text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                      {item.name}
                    </div>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User Section */}
        <div className="mt-auto p-4">
          <div
            className={cn(
              "rounded-2xl bg-sidebar-accent/30 border border-sidebar-border/20 p-3 transition-all duration-300",
              collapsed ? "items-center justify-center" : ""
            )}
          >
            <div
              className={cn("flex items-center gap-3", collapsed && "flex-col")}
            >
              <div className="relative">
                {user?.id ? (
                  <UserAvatar
                    userId={user.id}
                    userName={user.nome || "Usuário"}
                    className="h-10 w-10 rounded-xl border border-primary/10"
                    fallbackClassName="text-lg"
                    refreshKey={avatarRefreshKey}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-xl border border-primary/10 bg-primary/10 flex items-center justify-center">
                    <UserCircle className="h-6 w-6 text-primary" />
                  </div>
                )}
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-sidebar bg-success" />
              </div>

              {!collapsed && (
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-sidebar-foreground truncate">
                    {user?.nome || "Usuário"}
                  </p>
                  <p className="text-[10px] text-sidebar-foreground/50 truncate uppercase tracking-wider font-medium">
                    {user?.role || "Administrador"}
                  </p>
                </div>
              )}
            </div>

            <div
              className={cn(
                "mt-3 flex items-center gap-2",
                collapsed ? "flex-col" : "justify-between"
              )}
            >
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                className="h-9 w-9 rounded-xl hover:bg-primary/10 text-primary-foreground hover:text-primary transition-colors"
              >
                {collapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <ChevronLeft className="h-4 w-4" />
                )}
              </Button>

              <Button
                variant="ghost"
                size={collapsed ? "icon" : "sm"}
                onClick={() => setIsLogoutConfirmOpen(true)}
                className={cn(
                  "h-9 rounded-xl text-destructive hover:bg-destructive/10 hover:text-destructive transition-colors",
                  !collapsed && "flex-1 justify-start px-3 gap-2"
                )}
              >
                <LogOut className="h-4 w-4" />
                {!collapsed && <span className="font-medium">Sair</span>}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={isLogoutConfirmOpen}
        onOpenChange={setIsLogoutConfirmOpen}
        onConfirm={handleLogout}
        title="Sair do Sistema"
        description="Tem certeza que deseja sair? Você precisará fazer login novamente para acessar o sistema."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        variant="destructive"
      />
    </aside>
  );
}
