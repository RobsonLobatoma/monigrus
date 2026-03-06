import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type GrupoDB = Tables<"grupos">;

export function useGrupos() {
  return useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("ativo", true)
        .not("instance_id", "is", null)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as GrupoDB[];
    },
    refetchInterval: 5_000,
  });
}

export function useCreateGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (grupo: TablesInsert<"grupos">) => {
      const { error } = await supabase.from("grupos").insert(grupo);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

export function useUpdateGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<"grupos"> & { id: string }) => {
      const { error } = await supabase.from("grupos").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos"] }),
  });
}

export function useDeleteGrupo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("grupos")
        .update({ ativo: false })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["grupos"] }),
  });
}
