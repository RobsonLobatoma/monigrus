import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const invoke = async (action: string, params: Record<string, any> = {}) => {
  const { data, error } = await supabase.functions.invoke("whatsapp-orchestrator", {
    body: { action, ...params },
  });
  if (error) {
    // FunctionsHttpError stores the Response in error.context
    try {
      const ctx = (error as any).context;
      if (ctx && typeof ctx.json === "function") {
        const body = await ctx.json();
        if (body?.error) throw new Error(body.error);
      }
    } catch (e) {
      if (e instanceof Error && e.message !== "Edge Function returned a non-2xx status code") throw e;
    }
    throw new Error(error.message || "Erro na comunicação com o servidor");
  }
  if (data?.error) throw new Error(data.error);
  return data?.data;
};

export function useWhatsAppInstances() {
  return useQuery({
    queryKey: ["whatsapp-instances"],
    queryFn: () => invoke("get-instances"),
    staleTime: 10_000,
  });
}

export function useCreateInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceName, providerId }: { instanceName: string; providerId?: string }) =>
      invoke("create-instance", { instanceName, providerId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-instances"] }),
  });
}

export function useDeleteInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => invoke("delete-instance", { instanceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-instances"] }),
  });
}

export function useConnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => invoke("connect-instance", { instanceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-instances"] }),
  });
}

export function useDisconnectInstance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => invoke("disconnect-instance", { instanceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-instances"] }),
  });
}

export function useGetQrCode() {
  return useMutation({
    mutationFn: (instanceId: string) => invoke("get-qr-code", { instanceId }),
  });
}

export function useGetGroups() {
  return useMutation({
    mutationFn: (instanceId: string) => invoke("get-groups", { instanceId }),
  });
}

export function useSyncGroups() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ instanceId, tagId }: { instanceId: string; tagId?: string }) =>
      invoke("sync-groups", { instanceId, tagId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["grupos"] });
      qc.invalidateQueries({ queryKey: ["whatsapp-instances"] });
    },
  });
}

export function useCheckStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (instanceId: string) => invoke("check-status", { instanceId }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-instances"] }),
  });
}
