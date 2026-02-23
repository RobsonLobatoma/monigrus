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

export function useWhatsAppProviders() {
  return useQuery({
    queryKey: ["whatsapp-providers"],
    queryFn: () => invoke("list-providers"),
    staleTime: 30_000,
  });
}

export function useActivateProvider() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, isActive }: { providerId: string; isActive: boolean }) =>
      invoke("set-active-provider", { providerId, isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-providers"] }),
  });
}

export function useUpdateProviderConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ providerId, config }: { providerId: string; config: any }) =>
      invoke("update-provider-config", { providerId, config }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["whatsapp-providers"] }),
  });
}

export function useHealthCheck() {
  return useMutation({
    mutationFn: (providerId?: string) => invoke("health-check", { providerId }),
  });
}
