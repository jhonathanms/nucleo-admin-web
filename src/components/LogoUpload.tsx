import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ProdutoLogo } from "./ProdutoLogo";
import { Upload, Trash2, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "@/services/api";
import { resizeImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface LogoUploadProps {
  produtoId: string;
  produtoNome: string;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

const MAX_BACKEND_SIZE = 1048576; // 1MB

export function LogoUpload({
  produtoId,
  produtoNome,
  onUploadSuccess,
  onDeleteSuccess,
}: LogoUploadProps) {
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
        512, // Logos não precisam ser gigantes
        512,
        MAX_BACKEND_SIZE
      );

      if (processedFile.size > MAX_BACKEND_SIZE) {
        toast({
          title: "Imagem muito grande",
          description: "Tente uma imagem menor que 1MB.",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", processedFile);

      await api.post(`/produtos/${produtoId}/logo`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Logo atualizado",
        description: "O logo do produto foi salvo com sucesso.",
      });
      onUploadSuccess?.();
    } catch (error) {
      console.error("Erro ao enviar logo:", error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível enviar a imagem.",
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
      await api.delete(`/produtos/${produtoId}/logo`);

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Logo removido",
        description: "O logo do produto foi removido.",
      });
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Erro ao remover logo:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o logo.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isProcessing || isUploading || isDeleting;

  return (
    <div className="w-full">
      <div className="relative flex flex-col items-center p-4 rounded-xl border bg-card/50 border-dashed border-muted-foreground/20">
        <div className="relative group mb-4">
          <div
            className={cn(
              "relative rounded-md p-1",
              isLoading && "animate-pulse"
            )}
          >
            <ProdutoLogo
              produtoId={produtoId}
              produtoNome={produtoNome}
              className="h-20 w-20 border-2 border-background shadow-md"
              refreshKey={localRefreshKey}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 transition-all disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
            </button>
          </div>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 rounded-md">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-8 text-xs gap-1.5"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="h-3 w-3" />
            Logo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            disabled={isLoading}
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
