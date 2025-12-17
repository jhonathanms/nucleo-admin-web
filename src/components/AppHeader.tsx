import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
}

export function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  return (
    <header
      className="fixed top-0 right-0 z-30 h-16 border-b border-border bg-card/80 backdrop-blur-sm transition-all duration-300"
      style={{
        left: sidebarCollapsed ? "4rem" : "16rem",
      }}
    >
      <div className="flex h-full items-center justify-between px-6">
        <div className="relative max-w-md flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            className="pl-9 bg-background"
          />
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              3
            </span>
          </Button>
        </div>
      </div>
    </header>
  );
}
