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
