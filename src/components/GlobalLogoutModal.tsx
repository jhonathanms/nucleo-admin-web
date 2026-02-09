import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertCircle } from "lucide-react";

export function GlobalLogoutModal() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("Sessão expirada. Redirecionando...");

  useEffect(() => {
    const handleLogoutEvent = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string }>;
      setMessage(
        customEvent.detail?.message || "Sessão expirada. Redirecionando...",
      );
      setOpen(true);
    };

    window.addEventListener("nucleo_admin_logout_event", handleLogoutEvent);

    return () => {
      window.removeEventListener(
        "nucleo_admin_logout_event",
        handleLogoutEvent,
      );
    };
  }, []);

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-red-200 dark:border-red-900 shadow-2xl z-[9999]">
        <div className="absolute inset-0 bg-red-500/5 dark:bg-red-500/10 pointer-events-none" />
        <DialogHeader className="space-y-4 relative z-10">
          <div className="mx-auto w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-2">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
          </div>
          <DialogTitle className="text-center text-xl font-bold text-slate-900 dark:text-white">
            Sessão Encerrada
          </DialogTitle>
          <DialogDescription className="text-center text-slate-600 dark:text-slate-300 text-base">
            {message}
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-center p-4 relative z-10">
          <div className="h-1 w-12 bg-red-200 dark:bg-red-800 rounded-full animate-pulse" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
