import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const invoke = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke("whatsapp-orchestrator", {
    body: { action, ...params },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.data;
};

export function useMessageLog(instanceId?: string) {
  return useQuery({
    queryKey: ["whatsapp-message-log", instanceId],
    queryFn: () => invoke("get-message-log", { instanceId, limit: 200 }),
    staleTime: 15_000,
  });
}

export function useWebhooksLog(instanceId?: string) {
  return useQuery({
    queryKey: ["whatsapp-webhooks-log", instanceId],
    queryFn: () => invoke("get-webhooks-log", { instanceId, limit: 200 }),
    staleTime: 15_000,
  });
}

export function useSendMessage() {
  return useMutation({
    mutationFn: ({ instanceId, to, text }: { instanceId: string; to: string; text: string }) =>
      invoke("send-message", { instanceId, to, text }),
  });
}

export function useSendMedia() {
  return useMutation({
    mutationFn: (params: { instanceId: string; to: string; mediaUrl: string; mediaType?: string; caption?: string }) =>
      invoke("send-media", params),
  });
}
