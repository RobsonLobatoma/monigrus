import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook that subscribes to Supabase Realtime changes on `grupos` and `grupo_messages`
 * and auto-invalidates the "grupos" query so panels update in real time.
 */
export function useGroupConversations() {
  const qc = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel("grupos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "grupos" },
        () => {
          qc.invalidateQueries({ queryKey: ["grupos"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "grupo_messages" },
        () => {
          qc.invalidateQueries({ queryKey: ["grupos"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
