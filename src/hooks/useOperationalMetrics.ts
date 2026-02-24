import { useMemo } from "react";
import { useGrupos } from "@/hooks/useGrupos";
import { useTeams } from "@/hooks/useTeams";
import { useUserProfiles } from "@/hooks/useUserProfiles";
import { useAnomalias } from "@/hooks/useAnomalias";

export interface SquadMetrics {
  id: string;
  name: string;
  supervisor: string | null;
  capacidadeMaxima: number;
  totalGrupos: number;
  gruposAtivos: number;
  gruposCriticos: number;
  scoreMedio: number;
  capacidadePercent: number;
  alertasAtivos: number;
  gestores: GestorMetrics[];
}

export interface GestorMetrics {
  userId: string;
  name: string;
  teamId: string | null;
  capacidadeMaxima: number;
  totalGrupos: number;
  scoreMedio: number;
  capacidadePercent: number;
}

export function useOperationalMetrics(filterTeamId?: string | null) {
  const { data: grupos } = useGrupos();
  const { data: teams } = useTeams();
  const { data: profiles } = useUserProfiles();
  const { data: anomalias } = useAnomalias();

  const metrics = useMemo(() => {
    const allGrupos = grupos ?? [];
    const allTeams = (teams ?? []).filter((t) => t.is_active);
    const allProfiles = profiles ?? [];
    const allAnomalias = anomalias ?? [];

    // Global KPIs
    const gruposAtivos = allGrupos.filter((g) => g.ativo);
    const totalGruposAtivos = gruposAtivos.length;

    // Score is stored in grupos.mensagens as a proxy (there's no dedicated score column)
    // We'll use mensagens as the score metric since that's what Hub/Monitoramento display
    const scoreSum = gruposAtivos.reduce((sum, g) => sum + (g.mensagens ?? 0), 0);
    const scoreMedioGlobal = totalGruposAtivos > 0 ? Math.round(scoreSum / totalGruposAtivos) : 0;

    const alertasCriticos = allAnomalias.length;

    const gruposResolvidos = allGrupos.filter((g) => g.status === "RESOLVIDO").length;
    const taxaResolucao = allGrupos.length > 0 ? Math.round((gruposResolvidos / allGrupos.length) * 100) : 0;

    // Status distribution
    const statusDistribution: Record<string, number> = {};
    allGrupos.forEach((g) => {
      statusDistribution[g.status] = (statusDistribution[g.status] || 0) + 1;
    });

    // SLA distribution
    const slaDistribution: Record<string, number> = {};
    allGrupos.forEach((g) => {
      slaDistribution[g.sla] = (slaDistribution[g.sla] || 0) + 1;
    });

    // Gestor metrics (by gestor text field, since gestor_id may not be populated yet)
    const gestorMap = new Map<string, { grupos: typeof allGrupos; teamId: string | null }>();
    allGrupos.forEach((g) => {
      const gestorName = g.gestor || "Sem Gestor";
      if (!gestorMap.has(gestorName)) {
        gestorMap.set(gestorName, { grupos: [], teamId: g.team_id });
      }
      gestorMap.get(gestorName)!.grupos.push(g);
    });

    const gestorMetrics: GestorMetrics[] = [];
    gestorMap.forEach((data, name) => {
      if (name === "Sem Gestor") return;
      // Try to find a matching profile
      const profile = allProfiles.find((p) => p.full_name === name);
      const capMax = (profile as any)?.capacidade_maxima_gestor ?? 35;
      const total = data.grupos.length;
      const scoreS = data.grupos.reduce((s, g) => s + (g.mensagens ?? 0), 0);
      const avg = total > 0 ? Math.round(scoreS / total) : 0;
      gestorMetrics.push({
        userId: profile?.user_id ?? "",
        name,
        teamId: data.teamId,
        capacidadeMaxima: capMax,
        totalGrupos: total,
        scoreMedio: avg,
        capacidadePercent: Math.round((total / capMax) * 100),
      });
    });

    // Squad metrics
    const squadMetrics: SquadMetrics[] = allTeams.map((team) => {
      const capMax = team.capacidade_maxima ?? 110;
      const squadGrupos = allGrupos.filter((g) => g.team_id === team.id);
      const ativos = squadGrupos.filter((g) => g.ativo);
      const criticos = squadGrupos.filter((g) => g.status === "CRÍTICO");
      const scoreS = ativos.reduce((s, g) => s + (g.mensagens ?? 0), 0);
      const avg = ativos.length > 0 ? Math.round(scoreS / ativos.length) : 0;
      const squadAnomalias = allAnomalias.filter((a) => a.team_id === team.id);
      const squadGestores = gestorMetrics.filter((gm) => gm.teamId === team.id);

      return {
        id: team.id,
        name: team.name,
        supervisor: team.supervisor,
        capacidadeMaxima: capMax,
        totalGrupos: squadGrupos.length,
        gruposAtivos: ativos.length,
        gruposCriticos: criticos.length,
        scoreMedio: avg,
        capacidadePercent: Math.round((squadGrupos.length / capMax) * 100),
        alertasAtivos: squadAnomalias.length,
        gestores: squadGestores,
      };
    });

    // Sort by score desc
    squadMetrics.sort((a, b) => b.scoreMedio - a.scoreMedio);
    gestorMetrics.sort((a, b) => b.scoreMedio - a.scoreMedio);

    // Latest anomalias
    const latestAnomalias = [...allAnomalias]
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, 5);

    return {
      scoreMedioGlobal,
      totalGruposAtivos,
      alertasCriticos,
      taxaResolucao,
      statusDistribution,
      slaDistribution,
      squadMetrics: filterTeamId ? squadMetrics.filter((s) => s.id === filterTeamId) : squadMetrics,
      gestorMetrics: filterTeamId ? gestorMetrics.filter((g) => g.teamId === filterTeamId) : gestorMetrics,
      latestAnomalias,
      allGrupos,
    };
  }, [grupos, teams, profiles, anomalias, filterTeamId]);

  return metrics;
}
