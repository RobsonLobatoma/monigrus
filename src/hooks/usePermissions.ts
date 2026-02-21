import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUserRole } from "./useCurrentUserRole";

export interface Permission {
  id: string;
  code: string;
  description: string;
  module: string;
}

export interface RolePermission {
  id: string;
  role: string;
  permission_id: string;
}

export function usePermissions() {
  return useQuery({
    queryKey: ["permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("permissions")
        .select("*")
        .order("module", { ascending: true });
      if (error) throw error;
      return data as Permission[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useRolePermissions() {
  return useQuery({
    queryKey: ["role-permissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("role_permissions")
        .select("*");
      if (error) throw error;
      return data as RolePermission[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useCheckPermission(code: string): boolean {
  const { hasPermission } = useCurrentUserRole();
  return hasPermission(code);
}
