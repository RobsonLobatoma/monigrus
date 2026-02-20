import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Grupo {
  id: string;
  nome: string;
  team_id: string | null;
  sector_id: string | null;
  gestor: string | null;
  sla: string;
  status: string;
  mensagens: number;
  ultima_atividade: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export function useGrupos() {
  return useQuery({
    queryKey: ["grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("ativo", true)
        .order("nome");
      if (error) throw error;
      return (data ?? []) as Grupo[];
    },
  });
}

export function useCreateGrupo(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      nome: string;
      team_id?: string | null;
      gestor?: string | null;
      sla?: string;
      status?: string;
    }) => {
      const { data, error } = await supabase.from("grupos").insert([payload]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] });
      onSuccess?.();
    },
  });
}

export function useUpdateGrupo(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Partial<Grupo> & { id: string }) => {
      const { data, error } = await supabase.from("grupos").update(payload).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] });
      onSuccess?.();
    },
  });
}

export function useDeleteGrupo(onSuccess?: () => void) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("grupos").update({ ativo: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] });
      onSuccess?.();
    },
  });
}
