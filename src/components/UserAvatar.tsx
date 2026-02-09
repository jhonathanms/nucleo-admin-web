import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import usuarioService from "@/services/usuario.service";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser } from "@/contexts/UserContext";

interface UserAvatarProps {
  userId: string;
  userName: string;
  className?: string;
  fallbackClassName?: string;
  showEnlarge?: boolean;
  refreshKey?: number;
}

export function UserAvatar({
  userId,
  userName,
  className = "h-9 w-9",
  fallbackClassName = "",
  showEnlarge = true,
  refreshKey: propRefreshKey = 0,
}: UserAvatarProps) {
  const { user: loggedInUser, avatarRefreshKey: globalRefreshKey } = useUser();
  const [avatarData, setAvatarData] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Use global refresh key if this is the logged-in user
  const refreshKey = userId === loggedInUser?.id ? globalRefreshKey : propRefreshKey;

  useEffect(() => {
    let isMounted = true;

    const fetchAvatar = async () => {
      try {
        setIsLoading(true);
        setAvatarData(null); // Clear previous data on refresh

        if (!userId) {
          console.warn("UserAvatar: userId is empty", { userName });
          setIsLoading(false);
          return;
        }

        const hasAvatar = await usuarioService.checkAvatarExists(userId);
        if (hasAvatar && isMounted) {
          const data = await usuarioService.getAvatar(userId);
          if (isMounted) {
            // Construct full data URI if it's just the raw base64 string
            const fullBase64 = data.base64.startsWith("data:")
              ? data.base64
              : `data:${data.tipoMime};base64,${data.base64}`;
            setAvatarData(fullBase64);
          }
        }
      } catch (error) {
        console.error("Erro ao carregar avatar:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchAvatar();

    return () => {
      isMounted = false;
    };
  }, [userId, refreshKey]);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleAvatarClick = () => {
    if (showEnlarge && avatarData) {
      setIsModalOpen(true);
    }
  };

  if (isLoading) {
    return <Skeleton className={cn("rounded-full", className)} />;
  }

  return (
    <>
      <Avatar
        className={cn(
          "rounded-full",
          className,
          avatarData && showEnlarge
            ? "cursor-pointer hover:scale-105 active:scale-95 transition-all duration-300"
            : ""
        )}
        onClick={handleAvatarClick}
      >
        {avatarData ? (
          <AvatarImage
            src={avatarData}
            alt={userName}
            className="object-cover animate-in fade-in duration-500"
          />
        ) : null}
        <AvatarFallback
          className={cn(
            "bg-primary/10 text-primary font-medium rounded-full",
            fallbackClassName
          )}
        >
          {initials || <UserCircle className="h-2/3 w-2/3" />}
        </AvatarFallback>
      </Avatar>

      {showEnlarge && avatarData && (
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none focus:outline-none [&>button]:text-white [&>button]:bg-white/20 [&>button]:hover:bg-white/30 [&>button]:rounded-full [&>button]:p-2 [&>button]:opacity-100 [&>button]:ring-offset-transparent [&>button_svg]:h-5 [&>button_svg]:w-5">
            <DialogHeader className="sr-only">
              <DialogTitle className="text-primary">
                Avatar de {userName}
              </DialogTitle>
            </DialogHeader>
            <div className="flex items-center justify-center w-full h-full p-4 outline-none">
              <img
                src={avatarData}
                alt={userName}
                className="max-w-full max-h-[85vh] rounded-2xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)] object-contain animate-in zoom-in-90 fade-in duration-500 ease-out"
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
