import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { User } from "@/types/auth.types";
import authService from "@/services/auth.service";
import usuarioService from "@/services/usuario.service";

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  avatarRefreshKey: number;
  refreshAvatar: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [avatarRefreshKey, setAvatarRefreshKey] = useState(0);

  const setUser = useCallback((newUser: User | null) => {
    setUserState(newUser);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const updatedUser = await authService.getCurrentUser();
      setUserState(updatedUser);
    } catch (error) {
      console.error("Erro ao atualizar dados do usuário:", error);
    }
  }, []);

  const refreshAvatar = useCallback(() => {
    setAvatarRefreshKey((prev) => prev + 1);
  }, []);

  useEffect(() => {
    const storedUser = authService.getStoredUser();
    if (storedUser) {
      setUserState(storedUser);
    }
    refreshUser();
  }, [refreshUser]);

  return (
    <UserContext.Provider
      value={{ user, setUser, refreshUser, avatarRefreshKey, refreshAvatar }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
