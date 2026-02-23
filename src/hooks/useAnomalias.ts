import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Anomalia {
  id: string;
  payload: Record<string, any>;
  user_id: string | null;
  grupo_id: string | null;
  team_id: string | null;
  sector_id: string | null;
  occurred_at: string;
  created_at: string;
  updated_at: string;
  // joined
  grupo_nome?: string;
  team_name?: string;
  sector_name?: string;
}

export function useAnomalias() {
  return useQuery({
    queryKey: ["anomalias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("anomalias")
        .select(`
          *,
          grupos:grupo_id(nome),
          teams:team_id(name),
          sectors:sector_id(name)
        `)
        .order("occurred_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((row: any) => ({
        id: row.id,
        payload: row.payload ?? {},
        user_id: row.user_id,
        grupo_id: row.grupo_id,
        team_id: row.team_id,
        sector_id: row.sector_id,
        occurred_at: row.occurred_at,
        created_at: row.created_at,
        updated_at: row.updated_at,
        grupo_nome: row.grupos?.nome ?? null,
        team_name: row.teams?.name ?? null,
        sector_name: row.sectors?.name ?? null,
      })) as Anomalia[];
    },
  });
}
