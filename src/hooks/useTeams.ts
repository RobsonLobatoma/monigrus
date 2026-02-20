import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Team {
  id: string;
  name: string;
  supervisor: string | null;
  gestores: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teams")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Team[];
    },
  });
}

export function useCreateTeam(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { name: string; supervisor?: string; gestores?: string[] }) => {
      const { data, error } = await supabase.from("teams").insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      onSuccess?.();
    },
  });
}

export function useUpdateTeam(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Team> & { id: string }) => {
      const { data, error } = await supabase.from("teams").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      onSuccess?.();
    },
  });
}

export function useDeleteTeam(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").update({ is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["teams"] });
      onSuccess?.();
    },
  });
}
