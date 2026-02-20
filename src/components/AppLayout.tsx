import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [isDark, setIsDark] = useState(false);
  const { profile, role } = useAuth();

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const displayName = profile?.full_name ?? "Usuário";
  const displayRole = role ?? "—";
  const avatarLetter = displayName.trim().charAt(0).toUpperCase();

  const roleLabel: Record<string, string> = {
    DIRETOR: "Diretor",
    GERENTE: "Gerente",
    SUPERVISOR: "Supervisor",
    OPERACIONAL: "Operacional",
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />

      {/* Main content */}
      <div className="flex flex-col flex-1 ml-64 min-h-screen">
        {/* Top bar */}
        <header className="h-14 flex items-center justify-end gap-4 px-6 border-b border-border bg-card sticky top-0 z-30">
          <button
            onClick={toggleTheme}
            className="w-9 h-9 rounded-full border border-border flex items-center justify-center hover:bg-muted transition-colors text-foreground"
            title="Alternar tema"
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-sm font-semibold leading-tight text-foreground">{displayName}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {roleLabel[displayRole] ?? displayRole}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">{avatarLetter}</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-6 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
