import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

export function useChats(instanceId?: string) {
  return useQuery({
    queryKey: ["whatsapp-chats", instanceId],
    queryFn: () => invoke("get-chats", { instanceId }),
    enabled: !!instanceId,
    staleTime: 30_000,
  });
}

export function useChatMessages(instanceId?: string, remoteJid?: string) {
  return useQuery({
    queryKey: ["whatsapp-chat-messages", instanceId, remoteJid],
    queryFn: () => invoke("find-messages", { instanceId, remoteJid, limit: 100 }),
    enabled: !!instanceId && !!remoteJid,
    staleTime: 15_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, to, text }: { instanceId: string; to: string; text: string }) =>
      invoke("send-message", { instanceId, to, text }),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["whatsapp-chat-messages", variables.instanceId, variables.to] });
    },
  });
}

export function useSendMedia() {
  return useMutation({
    mutationFn: (params: { instanceId: string; to: string; mediaUrl: string; mediaType?: string; caption?: string }) =>
      invoke("send-media", params),
  });
}
