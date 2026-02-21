import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  AlertTriangle,
  Monitor,
  Link2,
  Settings,
  LogOut,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";

const navItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, permissionCode: null },
  { title: "Hub do Colaborador", url: "/hub", icon: Users, permissionCode: "VIEW_HUB" },
  { title: "Anomalias", url: "/anomalias", icon: AlertTriangle, permissionCode: "VIEW_ANOMALIAS" },
  { title: "Monitoramento", url: "/monitoramento", icon: Monitor, permissionCode: "VIEW_MONITORAMENTO" },
  { title: "Conexões", url: "/conexoes", icon: Link2, permissionCode: "VIEW_CONEXOES" },
  { title: "Configurações", url: "/configuracoes", icon: Settings, permissionCode: "VIEW_CONFIGURACOES" },
];

export function AppSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const { hasPermission, loading: roleLoading } = useCurrentUserRole();

  const visibleItems = navItems.filter((item) => {
    if (!item.permissionCode) return true;
    if (roleLoading) return true; // show all while loading for no flash
    return hasPermission(item.permissionCode);
  });

  return (
    <aside className="fixed left-0 top-0 h-full w-64 flex flex-col bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))] z-40">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground font-bold text-base">M</span>
        </div>
        <span className="text-[hsl(var(--sidebar-foreground))] font-bold text-lg tracking-wide">
          MONIGRU
        </span>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const isActive = location.pathname === item.url;
          return (
            <Link
              key={item.title}
              to={item.url}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))]"
              }`}
            >
              <item.icon
                className={`w-4.5 h-4.5 flex-shrink-0 ${isActive ? "opacity-100" : "opacity-70"}`}
                size={18}
              />
              <span>{item.title}</span>
            </Link>
          );
        })}
      </nav>

      {/* Sair */}
      <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
        <button
          onClick={signOut}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))] hover:text-[hsl(var(--sidebar-accent-foreground))] transition-all duration-150 w-full"
        >
          <LogOut size={18} className="opacity-70" />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  );
}
