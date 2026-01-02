import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "./UserAvatar";
import { Upload, Trash2, Camera, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import usuarioService from "@/services/usuario.service";
import { resizeImage } from "@/lib/image-utils";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface AvatarUploadProps {
  userId: string;
  userName: string;
  onUploadSuccess?: () => void;
  onDeleteSuccess?: () => void;
}

const MAX_BACKEND_SIZE = 1048576; // 1MB (1024 * 1024)

export function AvatarUpload({
  userId,
  userName,
  onUploadSuccess,
  onDeleteSuccess,
}: AvatarUploadProps) {
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

      // Resize image if needed to fit 1MB limit
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
      await usuarioService.uploadAvatar(userId, processedFile);

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Avatar atualizado",
        description: "Sua foto de perfil foi salva com sucesso.",
      });
      onUploadSuccess?.();
    } catch (error) {
      console.error("Erro ao processar/enviar avatar:", error);
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
      await usuarioService.deleteAvatar(userId);

      setLocalRefreshKey((prev) => prev + 1);
      toast({
        title: "Avatar removido",
        description: "Sua foto de perfil foi removida.",
      });
      onDeleteSuccess?.();
    } catch (error) {
      console.error("Erro ao remover avatar:", error);
      toast({
        title: "Erro ao remover",
        description: "Não foi possível remover o avatar.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isProcessing || isUploading || isDeleting;

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="relative flex flex-col items-center p-6 rounded-2xl border bg-card/50 backdrop-blur-sm shadow-sm transition-all hover:shadow-md border-dashed border-muted-foreground/20">
        <div className="relative group mb-6">
          <div
            className={cn(
              "relative rounded-full p-1 bg-gradient-to-tr from-primary/20 via-primary/5 to-transparent animate-in fade-in zoom-in duration-500",
              isLoading && "animate-pulse"
            )}
          >
            <UserAvatar
              userId={userId}
              userName={userName}
              className="h-28 w-28 border-4 border-background shadow-xl"
              fallbackClassName="text-3xl"
              refreshKey={localRefreshKey}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="absolute bottom-1 right-1 p-2 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-110 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
              title="Alterar foto"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-[1px] rounded-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </div>

        <div className="text-center space-y-1 mb-6">
          <h4 className="text-sm font-semibold text-foreground">
            Foto de Perfil
          </h4>
          <p className="text-xs text-muted-foreground">
            {isProcessing
              ? "Otimizando imagem..."
              : isUploading
              ? "Enviando para o servidor..."
              : "JPG, PNG ou GIF até 1MB"}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 h-9 rounded-xl gap-2 font-medium hover:bg-primary/5 hover:text-primary hover:border-primary/30 transition-colors"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
          >
            <Upload className="h-3.5 w-3.5" />
            Upload
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 w-9 rounded-xl p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            onClick={handleDelete}
            disabled={isLoading}
            title="Remover foto"
          >
            <Trash2 className="h-4 w-4" />
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
