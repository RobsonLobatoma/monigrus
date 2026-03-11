import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type GrupoDB = Tables<"grupos">;

type ConnectedInstance = Pick<Tables<"whatsapp_instances">, "id">;

const MONITORAMENTO_QUERY_KEY = ["monitoramento-grupos"] as const;

const syncGroupsForInstance = async (instanceId: string) => {
  const { data, error } = await supabase.functions.invoke("whatsapp-orchestrator", {
    body: { action: "sync-groups", instanceId },
  });

  if (error) {
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) throw new Error(body.error);
      }
    } catch (e) {
      if (e instanceof Error && e.message !== "Edge Function returned a non-2xx status code") throw e;
    }
    throw new Error(error.message || "Erro ao sincronizar grupos");
  }

  if (data?.error) throw new Error(data.error);
};

/**
 * Hook dedicado ao Painel de Monitoramento.
 * - Exibe apenas grupos ativos vinculados a instâncias válidas
 * - Auto-sincroniza grupos de instâncias conectadas recém-criadas
 * - Mantém atualização em tempo real (grupos, mensagens e instâncias)
 */
export function useMonitoramentoGrupos() {
  const queryClient = useQueryClient();
  const attemptedSyncRef = useRef<Set<string>>(new Set());

  const query = useQuery({
    queryKey: MONITORAMENTO_QUERY_KEY,
    queryFn: async () => {
      const { data: connectedInstances, error: connectedErr } = await supabase
        .from("whatsapp_instances")
        .select("id")
        .eq("status", "connected");

      if (connectedErr) throw connectedErr;

      const connectedIds = (connectedInstances as ConnectedInstance[] | null)?.map((i) => i.id) ?? [];
      const connectedSet = new Set(connectedIds);

      for (const instanceId of Array.from(attemptedSyncRef.current)) {
        if (!connectedSet.has(instanceId)) attemptedSyncRef.current.delete(instanceId);
      }

      if (connectedIds.length > 0) {
        const { data: existingGroups, error: existingErr } = await supabase
          .from("grupos")
          .select("instance_id")
          .eq("ativo", true)
          .in("instance_id", connectedIds);

        if (existingErr) throw existingErr;

        const instanceIdsWithGroups = new Set(
          (existingGroups ?? [])
            .map((g) => g.instance_id)
            .filter((id): id is string => Boolean(id))
        );

        const missingInstanceIds = connectedIds.filter(
          (id) => !instanceIdsWithGroups.has(id) && !attemptedSyncRef.current.has(id)
        );

        if (missingInstanceIds.length > 0) {
          missingInstanceIds.forEach((id) => attemptedSyncRef.current.add(id));
          const syncResults = await Promise.allSettled(missingInstanceIds.map((id) => syncGroupsForInstance(id)));

          syncResults.forEach((result, index) => {
            if (result.status === "rejected") {
              attemptedSyncRef.current.delete(missingInstanceIds[index]);
            }
          });
        }
      }

      const { data, error } = await supabase
        .from("grupos")
        .select("*")
        .eq("ativo", true)
        .not("instance_id", "is", null)
        .order("last_message_at", { ascending: false, nullsFirst: false });

      if (error) throw error;
      return data as GrupoDB[];
    },
    staleTime: 5_000,
    refetchInterval: 5_000,
  });

  useEffect(() => {
    const invalidate = () => {
      queryClient.invalidateQueries({ queryKey: MONITORAMENTO_QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["grupos"] });
    };

    const channel = supabase
      .channel("monitoramento-grupos-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "grupos" }, invalidate)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "grupo_messages" }, invalidate)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "whatsapp_message_log" }, invalidate)
      .on("postgres_changes", { event: "*", schema: "public", table: "whatsapp_instances" }, invalidate)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return query;
}

