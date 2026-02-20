import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  team_id: string | null;
  sector_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  role?: string | null;
}

export function useUserProfiles() {
  return useQuery({
    queryKey: ["user_profiles"],
    queryFn: async () => {
      const { data: profiles, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("is_active", true)
        .order("full_name");
      if (error) throw error;

      if (!profiles || profiles.length === 0) return [] as UserProfile[];

      // Fetch roles for all users
      const userIds = profiles.map((p) => p.user_id);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role")
        .in("user_id", userIds);

      const roleMap = new Map((roles ?? []).map((r) => [r.user_id, r.role]));

      return profiles.map((p) => ({
        ...p,
        role: roleMap.get(p.user_id) ?? null,
      })) as UserProfile[];
    },
  });
}

export function useUpdateUserProfile(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      user_id,
      ...payload
    }: { user_id: string; full_name?: string; email?: string; team_id?: string | null }) => {
      const { data, error } = await supabase
        .from("user_profiles")
        .update(payload)
        .eq("user_id", user_id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profiles"] });
      onSuccess?.();
    },
  });
}

export function useDeleteUserProfile(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (user_id: string) => {
      const { error } = await supabase
        .from("user_profiles")
        .update({ is_active: false })
        .eq("user_id", user_id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["user_profiles"] });
      onSuccess?.();
    },
  });
}
