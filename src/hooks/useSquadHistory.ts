import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SquadHistoryEntry {
  id: string;
  user_id: string;
  old_team_id: string | null;
  new_team_id: string | null;
  changed_by: string;
  reason: string;
  created_at: string;
}

export function useSquadHistory(userId?: string) {
  return useQuery({
    queryKey: ["squad-history", userId],
    queryFn: async () => {
      let query = supabase
        .from("user_squad_history")
        .select("*")
        .order("created_at", { ascending: false });
      if (userId) query = query.eq("user_id", userId);
      const { data, error } = await query;
      if (error) throw error;
      return data as SquadHistoryEntry[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useLogSquadChange() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (params: {
      user_id: string;
      old_team_id: string | null;
      new_team_id: string | null;
      reason: string;
    }) => {
      const { error } = await supabase.from("user_squad_history").insert({
        user_id: params.user_id,
        old_team_id: params.old_team_id,
        new_team_id: params.new_team_id,
        changed_by: user?.id ?? "",
        reason: params.reason,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["squad-history"] });
    },
  });
}
