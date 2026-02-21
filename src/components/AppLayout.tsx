import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Moon, Sun } from "lucide-react";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user } = useAuth();
  const [isDark, setIsDark] = useState(false);

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
              <p className="text-sm font-semibold leading-tight text-foreground">
                {user?.user_metadata?.full_name || user?.email || "Usuário"}
              </p>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {user?.email || ""}
              </p>
            </div>
            <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-semibold text-sm">
                {(user?.user_metadata?.full_name || user?.email || "U").charAt(0).toUpperCase()}
              </span>
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
