import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";
import authService from "@/services/auth.service";
import sessaoService from "@/services/sessao.service";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      const user = authService.getStoredUser();

      if (!authService.isAuthenticated() || !user) {
        navigate("/login", { replace: true, state: { from: location } });
        return;
      }

      // Only validate product-specific session for CLIENTE role
      if (user.role === "CLIENTE") {
        try {
          await sessaoService.validarSessao();
        } catch (error: any) {
          // Only redirect if it's a 401 (Unauthorized)
          if (error.response?.status === 401) {
            console.error("Session validation failed (Unauthorized):", error);
            navigate("/login", { replace: true });
          } else {
            console.warn("Session validation endpoint error (non-401):", error);
          }
        }
      }
    };

    checkAuth();
  }, [navigate, location]);

  // Inactivity Timeout Logic
  useEffect(() => {
    const INACTIVITY_LIMIT = 10 * 60 * 1000; // 10 minutes
    let timeoutId: NodeJS.Timeout;

    const handleLogout = async () => {
      try {
        await authService.logout();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Auto-logout failed:", error);
        navigate("/login", { replace: true });
      }
    };

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(handleLogout, INACTIVITY_LIMIT);
    };

    // Events to track activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
    ];

    // Set initial timer
    resetTimer();

    // Add event listeners
    events.forEach((event) => {
      document.addEventListener(event, resetTimer);
    });

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach((event) => {
        document.removeEventListener(event, resetTimer);
      });
    };
  }, [navigate]);

  // Heartbeat Logic (Every 5 minutes)
  useEffect(() => {
    const HEARTBEAT_INTERVAL = 5 * 60 * 1000;

    const runHeartbeat = async () => {
      const user = authService.getStoredUser();

      // Only run heartbeat for CLIENTE role
      if (authService.isAuthenticated() && user?.role === "CLIENTE") {
        try {
          await sessaoService.heartbeat();
        } catch (error) {
          console.error("Heartbeat failed:", error);
          // If heartbeat fails, it likely means session is invalid
          authService.logout();
          navigate("/login", { replace: true });
        }
      }
    };

    const intervalId = setInterval(runHeartbeat, HEARTBEAT_INTERVAL);

    return () => clearInterval(intervalId);
  }, [navigate]);

  if (!authService.isAuthenticated()) {
    return null; // Or a loading spinner
  }

  return (
    <div className="h-screen bg-background overflow-hidden flex flex-col">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AppHeader sidebarCollapsed={sidebarCollapsed} />
      <main
        className={cn(
          "flex-1 flex flex-col overflow-hidden pt-20 transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "pl-20" : "pl-80"
        )}
      >
        <div className="flex-1 flex flex-col overflow-hidden p-6 animate-fade-in max-w-[1600px] mx-auto w-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
