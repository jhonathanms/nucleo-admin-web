import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import api from "@/services/api";
import { Package } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ProdutoLogoProps {
  produtoId: string;
  produtoNome: string;
  planoNome?: string;
  className?: string;
  fallbackClassName?: string;
  refreshKey?: number;
  showTooltip?: boolean;
}

export function ProdutoLogo({
  produtoId,
  produtoNome,
  planoNome,
  className = "h-8 w-8",
  fallbackClassName = "",
  refreshKey = 0,
  showTooltip = false,
}: ProdutoLogoProps) {
  const [logoData, setLogoData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchLogo = async () => {
      try {
        setIsLoading(true);
        // Usamos a mesma estrutura de endpoint do avatar, mas para produtos
        const response = await api.get(`/produtos/${produtoId}/logo/exists`);
        if (response.data.hasLogo && isMounted) {
          const logoRes = await api.get(`/produtos/${produtoId}/logo`);
          if (isMounted) {
            const data = logoRes.data;
            const fullBase64 = data.base64.startsWith("data:")
              ? data.base64
              : `data:${data.tipoMime};base64,${data.base64}`;
            setLogoData(fullBase64);
          }
        }
      } catch (error) {
        // Silenciosamente falha se não houver logo ou endpoint não existir ainda
        console.debug("Logo não encontrado para o produto:", produtoId);
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
  }, [produtoId, refreshKey]);

  if (isLoading) {
    return <Skeleton className={cn("rounded-full", className)} />;
  }

  const content = (
    <Avatar
      className={cn("rounded-full border bg-background shadow-sm", className)}
    >
      {logoData ? (
        <AvatarImage
          src={logoData}
          alt={produtoNome}
          className="object-contain p-1"
        />
      ) : null}
      <AvatarFallback
        className={cn(
          "bg-muted text-muted-foreground rounded-full",
          fallbackClassName
        )}
      >
        <Package className="h-1/2 w-1/2" />
      </AvatarFallback>
    </Avatar>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={0}>
          <TooltipTrigger asChild>{content}</TooltipTrigger>
          <TooltipContent
            side="top"
            className="flex flex-col gap-0.5 z-[100] bg-popover text-popover-foreground border shadow-md p-2"
            sideOffset={5}
          >
            <p className="font-bold text-xs">{produtoNome}</p>
            {planoNome && <p className="text-[10px] opacity-80">{planoNome}</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return content;
}
