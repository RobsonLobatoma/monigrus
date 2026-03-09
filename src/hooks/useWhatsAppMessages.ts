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
    queryFn: () => invoke("get-message-log", { instanceId, limit: 50 }),
    staleTime: 60_000,
    enabled: !!instanceId,
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
    refetchInterval: 30_000,
  });
}

export function useChatMessages(instanceId?: string, remoteJid?: string) {
  return useQuery({
    queryKey: ["whatsapp-chat-messages", instanceId, remoteJid],
    queryFn: () => invoke("find-messages", { instanceId, remoteJid, limit: 100 }),
    enabled: !!instanceId && !!remoteJid,
    staleTime: 10_000,
    refetchInterval: 10_000,
  });
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, to, text }: { instanceId: string; to: string; text: string }) =>
      invoke("send-message", { instanceId, to, text }),
    onMutate: async (variables) => {
      const qk = ["whatsapp-chat-messages", variables.instanceId, variables.to];
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData(qk);
      qc.setQueryData(qk, (old: any[] | undefined) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          fromMe: true,
          remoteJid: variables.to,
          pushName: "",
          text: variables.text,
          timestamp: Math.floor(Date.now() / 1000),
          messageType: "conversation",
          mediaUrl: "",
          mimetype: "",
          fileName: "",
        },
      ]);
      return { prev, qk };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.qk, ctx.prev);
    },
    // No onSuccess invalidation to avoid duplication
  });
}

export function useSendMedia() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceId: string; to: string; mediaUrl: string; mediaType?: string; caption?: string }) =>
      invoke("send-media", params),
    onMutate: async (variables) => {
      const qk = ["whatsapp-chat-messages", variables.instanceId, variables.to];
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData(qk);
      qc.setQueryData(qk, (old: any[] | undefined) => [
        ...(old || []),
        {
          id: `temp-${Date.now()}`,
          fromMe: true,
          remoteJid: variables.to,
          pushName: "",
          text: variables.caption || "",
          timestamp: Math.floor(Date.now() / 1000),
          messageType: variables.mediaType || "image",
          mediaUrl: variables.mediaUrl,
          mimetype: "",
          fileName: "",
        },
      ]);
      return { prev, qk };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.qk, ctx.prev);
    },
  });
}

export function useDeleteMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceId: string; messageId: string; remoteJid: string; fromMe?: boolean }) =>
      invoke("delete-message", params),
    onMutate: async (variables) => {
      const qk = ["whatsapp-chat-messages", variables.instanceId, variables.remoteJid];
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData(qk);
      qc.setQueryData(qk, (old: any[] | undefined) =>
        (old || []).filter((m: any) => m.id !== variables.messageId)
      );
      return { prev, qk };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.qk, ctx.prev);
    },
  });
}

export function useEditMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params: { instanceId: string; messageId: string; remoteJid: string; text: string; fromMe?: boolean }) =>
      invoke("edit-message", params),
    onMutate: async (variables) => {
      const qk = ["whatsapp-chat-messages", variables.instanceId, variables.remoteJid];
      await qc.cancelQueries({ queryKey: qk });
      const prev = qc.getQueryData(qk);
      qc.setQueryData(qk, (old: any[] | undefined) =>
        (old || []).map((m: any) =>
          m.id === variables.messageId ? { ...m, text: variables.text } : m
        )
      );
      return { prev, qk };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.qk, ctx.prev);
    },
  });
}
