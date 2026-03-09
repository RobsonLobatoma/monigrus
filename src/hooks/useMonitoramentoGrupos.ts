import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GrupoDB = Tables<"grupos">;

/**
 * Hook dedicado ao Painel de Monitoramento.
 * Busca TODOS os grupos ativos (independente de instance_id)
 * e mantém sincronização em tempo real via Supabase Realtime.
 */
export function useMonitoramentoGrupos() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["monitoramento-grupos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("ativo", true)
        .order("last_message_at", { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data as GrupoDB[];
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });

  // Supabase Realtime: atualização instantânea ao receber eventos
  useEffect(() => {
    const channel = supabase
      .channel("monitoramento-grupos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grupos" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["monitoramento-grupos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}
