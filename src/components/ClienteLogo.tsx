import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import clienteService from "@/services/cliente.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Building2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ClienteLogoProps {
  clienteId: string;
  razaoSocial: string;
  className?: string;
  fallbackClassName?: string;
  showEnlarge?: boolean;
  refreshKey?: number;
}

export function ClienteLogo({
  clienteId,
  razaoSocial,
  className = "h-9 w-9",
  fallbackClassName = "",
  showEnlarge = true,
  refreshKey = 0,
}: ClienteLogoProps) {
  const [logoData, setLogoData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        setLogoData(null);

        if (!clienteId) {
          setIsLoading(false);
          return;
        }

        const hasLogo = await clienteService.hasLogo(clienteId);
        if (hasLogo && isMounted) {
          const data = await clienteService.getLogo(clienteId);
          if (isMounted) {
            const fullBase64 = data.base64.startsWith("data:")
              ? data.base64
              : `data:${data.tipoMime};base64,${data.base64}`;
            setLogoData(fullBase64);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar logo do cliente:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchLogo();

    return () => {
      isMounted = false;
    };
  }, [clienteId, refreshKey]);

  const initials = razaoSocial
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleLogoClick = () => {
    if (showEnlarge && logoData) {
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return <Skeleton className={cn("rounded-lg", className)} />;
  }

  return (
    <>
      <Avatar
        className={cn(
          "rounded-lg",
          className,
          logoData && showEnlarge
            ? "cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            : ""
        )}
        onClick={handleLogoClick}
      >
        {logoData ? (
          <AvatarImage
            src={logoData}
            alt={razaoSocial}
            className="object-contain p-1 animate-in fade-in duration-500"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-primary/10 text-primary font-medium rounded-lg",
            fallbackClassName
          )}
        >
          {initials || <Building2 className="h-2/3 w-2/3" />}
        </AvatarFallback>
      </Avatar>

      {showEnlarge && logoData && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none [&>button]:text-white [&>button]:bg-white/20 [&>button]:rounded-full [&>button]:p-2 [&>button]:opacity-100 [&>button]:ring-offset-transparent [&>button_svg]:h-5 [&>button_svg]:w-5">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-primary">
                Logo de {razaoSocial}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center w-full h-full p-4 outline-none">
              <img
                src={logoData}
                alt={razaoSocial}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] object-contain animate-in zoom-in-90 fade-in duration-500 ease-out"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
