import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type MonitoringCategory = "PALAVRA_CHAVE" | "SATISFACAO" | "SCORE" | "STATUS";

export interface MonitoringSetting {
  id: string;
  category: MonitoringCategory;
  label: string;
  color: string;
  min_value: number | null;
  max_value: number | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

const QUERY_KEY = "monitoring_settings";

export function useMonitoringSettings(category?: MonitoringCategory) {
  return useQuery({
    queryKey: [QUERY_KEY, category],
    queryFn: async () => {
      let q = supabase
        .from("monitoring_settings" as any)
        .select("*")
        .order("sort_order", { ascending: true });
      if (category) q = q.eq("category", category);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as MonitoringSetting[];
    },
  });
}

export function useCreateMonitoringSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Omit<MonitoringSetting, "id" | "created_at" | "updated_at">) => {
      const { data, error } = await supabase
        .from("monitoring_settings" as any)
        .insert(input as any)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useUpdateMonitoringSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MonitoringSetting> & { id: string }) => {
      const { data, error } = await supabase
        .from("monitoring_settings" as any)
        .update(updates as any)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}

export function useDeleteMonitoringSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("monitoring_settings" as any)
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [QUERY_KEY] }),
  });
}
