import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ClienteLogo } from "./ClienteLogo";
import { Upload, Trash2, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import clienteService from "@/services/cliente.service";
import { resizeImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface ClienteLogoUploadProps {
  clienteId: string;
  razaoSocial: string;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

const MAX_BACKEND_SIZE = 1048576; // 1MB

export function ClienteLogoUpload({
  clienteId,
  razaoSocial,
  onUploadSuccess,
  onDeleteSuccess,
}: ClienteLogoUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [localRefreshKey, setLocalRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);

      const processedFile = await resizeImage(
        file,
        1024,
        1024,
        MAX_BACKEND_SIZE
      );

      if (processedFile.size > MAX_BACKEND_SIZE) {
        toast({
          title: "Imagem muito grande",
          description:
            "Não foi possível reduzir a imagem para menos de 1MB. Tente outra imagem.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      await clienteService.uploadLogo(clienteId, processedFile);

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Logo atualizada",
        description: "A logo do cliente foi salva com sucesso.",
      });
      onUploadSuccess?.();
    } catch (error) {
      console.error("Erro ao processar/enviar logo:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível processar ou enviar a imagem.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await clienteService.deleteLogo(clienteId);

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Logo removida",
        description: "A logo do cliente foi removida.",
      });
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Erro ao remover logo:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover a logo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isProcessing || isUploading || isDeleting;

  return (
    <div className="w-full">
      <div className="relative flex flex-col items-center p-4 rounded-xl border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md border-dashed border-muted-foreground/20">
        <div className="relative group mb-4">
          <div
            className={cn(
              "relative rounded-lg p-1 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent animate-in fade-in zoom-in duration-500",
              isLoading && "animate-pulse"
            )}
          >
            <ClienteLogo
              clienteId={clienteId}
              razaoSocial={razaoSocial}
              className="h-24 w-24 border-2 border-background shadow-lg rounded-lg"
              fallbackClassName="text-2xl"
              refreshKey={localRefreshKey}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="absolute bottom-1 right-1 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              title="Alterar logo"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-lg">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1 mb-4">
          <h4 className="text-xs font-semibold text-foreground">
            Logo da Empresa
          </h4>
          <p className="text-[10px] text-muted-foreground">
            {isProcessing
              ? "Otimizando..."
              : isUploading
              ? "Enviando..."
              : "JPG ou PNG até 1MB"}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-[11px] rounded-lg gap-1.5 font-medium transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="h-3 w-3" />
            Upload
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 rounded-lg p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleDelete}
            disabled={isLoading}
            title="Remover logo"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          onChange={handleFileChange}
        />
      </div>
    </div>
  );
}
