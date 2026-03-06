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
        (payload) => {
          console.debug("[Realtime] grupos change:", payload.eventType);
          qc.invalidateQueries({ queryKey: ["grupos"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "grupo_messages" },
        () => {
          console.debug("[Realtime] new grupo_message");
          qc.invalidateQueries({ queryKey: ["grupos"] });
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "whatsapp_message_log" },
        () => {
          console.debug("[Realtime] new whatsapp_message_log");
          qc.invalidateQueries({ queryKey: ["grupos"] });
        }
      )
      .subscribe((status) => {
        console.debug("[Realtime] channel status:", status);
        if (status === "CHANNEL_ERROR") {
          setTimeout(() => {
            supabase.removeChannel(channel);
          }, 5_000);
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [qc]);
}
