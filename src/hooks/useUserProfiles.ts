import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesUpdate } from "@/integrations/supabase/types";

export interface UserProfileWithRole {
  user_id: string;
  full_name: string;
  email: string;
  is_active: boolean;
  team_id: string | null;
  sector_id: string | null;
  created_at: string;
  updated_at: string;
  last_access_at: string | null;
  funcao: string;
  role: string;
}

async function fetchUserProfiles(): Promise<UserProfileWithRole[]> {
  const { data: profiles, error: pErr } = await supabase
    .from("user_profiles")
    .select("*")
    .order("created_at", { ascending: true });

  if (pErr) throw pErr;
  if (!profiles || profiles.length === 0) return [];

  const { data: roles, error: rErr } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rErr) throw rErr;

  const roleMap = new Map<string, string>();
  roles?.forEach((r) => roleMap.set(r.user_id, r.role));

  return profiles.map((p) => ({
    ...p,
    role: roleMap.get(p.user_id) ?? "OPERACIONAL",
  }));
}

export function useUserProfiles() {
  return useQuery({
    queryKey: ["user-profiles"],
    queryFn: fetchUserProfiles,
  });
}

export function useUpdateUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user_id,
      profile,
      role,
    }: {
      user_id: string;
      profile?: Partial<TablesUpdate<"user_profiles">>;
      role?: string;
    }) => {
      if (profile) {
        const { error } = await supabase
          .from("user_profiles")
          .update(profile)
          .eq("user_id", user_id);
        if (error) throw error;
      }
      if (role) {
        const { error } = await supabase
          .from("user_roles")
          .update({ role: role as any })
          .eq("user_id", user_id);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-profiles"] }),
  });
}

export function useDeleteUserProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: false })
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user-profiles"] }),
  });
}
