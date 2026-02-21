import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "DIRETOR" | "GERENTE" | "SUPERVISOR" | "OPERACIONAL";

const ROLE_LEVEL: Record<AppRole, number> = {
  DIRETOR: 1,
  GERENTE: 2,
  SUPERVISOR: 3,
  OPERACIONAL: 4,
};

export function useCurrentUserRole() {
  const { user } = useAuth();

  const { data: roleData, isLoading: loadingRole } = useQuery({
    queryKey: ["current-user-role", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.role as AppRole | null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: userProfile, isLoading: loadingProfile } = useQuery({
    queryKey: ["current-user-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("user_profiles")
        .select("full_name, team_id, sector_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const { data: permissionCodes, isLoading: loadingPerms } = useQuery({
    queryKey: ["current-user-permissions", roleData],
    queryFn: async () => {
      if (!roleData) return [] as string[];
      const { data, error } = await supabase
        .from("role_permissions")
        .select("permission_id, permissions(code)")
        .eq("role", roleData);
      if (error) throw error;
      return (data ?? []).map((rp: any) => rp.permissions?.code as string).filter(Boolean);
    },
    enabled: !!roleData,
    staleTime: 5 * 60 * 1000,
  });

  const role: AppRole = roleData ?? "OPERACIONAL";
  const level = ROLE_LEVEL[role];

  const canManage = (targetLevel: number) => level < targetLevel;

  const hasPermission = (code: string): boolean => {
    if (!permissionCodes) return false;
    return permissionCodes.includes(code);
  };

  return {
    role,
    level,
    loading: loadingRole || loadingProfile || loadingPerms,
    canManage,
    hasPermission,
    userName: userProfile?.full_name ?? null,
    teamId: userProfile?.team_id ?? null,
    sectorId: userProfile?.sector_id ?? null,
    userId: user?.id ?? null,
  };
}
