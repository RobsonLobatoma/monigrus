import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Tag = Tables<"tags">;

async function getOrgId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");

  // 1) Tentar organization_members
  const { data: member } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (member) return member.organization_id;

  // 2) Fallback: buscar organização única e auto-vincular
  const { data: orgs } = await supabase
    .from("organizations")
    .select("id")
    .limit(2);
  if (orgs && orgs.length === 1) {
    const orgId = orgs[0].id;
    // Auto-criar membership para o usuário
    await supabase
      .from("organization_members")
      .insert({ organization_id: orgId, user_id: user.id })
      .throwOnError();
    return orgId;
  }

  throw new Error("Organização não encontrada");
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("nome");
      if (error) throw error;
      return data as Tag[];
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ nome, cor }: { nome: string; cor: string }) => {
      const orgId = await getOrgId();
      const { error } = await supabase.from("tags").insert({ nome, cor, organization_id: orgId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, nome, cor }: { id: string; nome?: string; cor?: string }) => {
      const updates: any = {};
      if (nome !== undefined) updates.nome = nome;
      if (cor !== undefined) updates.cor = cor;
      const { error } = await supabase.from("tags").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tags").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}
