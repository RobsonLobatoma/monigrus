import { useState, useMemo } from "react";
import {
  LayoutGrid,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Trophy,
  Shield,
  Search,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useOperationalMetrics } from "@/hooks/useOperationalMetrics";
import { useGrupos } from "@/hooks/useGrupos";
import { useMonitoringSettings } from "@/hooks/useMonitoringSettings";
import { CapacityAlert } from "@/components/CapacityAlert";
import { Navigate } from "react-router-dom";

/* ─── Table styles (matching Monitoramento.tsx) ─── */
const FALLBACK_SAT_STYLE: Record<string, { background: string; color: string }> = {
  "Ótimo":   { background: "#22c55e", color: "#ffffff" },
  "Regular": { background: "#facc15", color: "#000000" },
  "Ruim":    { background: "#ef4444", color: "#ffffff" },
};

const thStyle: React.CSSProperties = {
  padding: "12px 12px", textAlign: "left", fontSize: "10px", fontWeight: 700,
  letterSpacing: "0.08em", textTransform: "uppercase", color: "hsl(var(--muted-foreground))",
  boxSizing: "border-box", borderBottom: "1px solid hsl(var(--border))", whiteSpace: "nowrap",
};

const tdBase: React.CSSProperties = {
  padding: "0 12px", verticalAlign: "middle", height: "56px", boxSizing: "border-box",
};

const tdColoredOuter: React.CSSProperties = {
  padding: 0, height: "56px", boxSizing: "border-box",
};

const cellFill: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center",
  height: "56px", width: "100%", fontWeight: 600, fontSize: "13px",
};

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

const Squads = () => {
  const { role, teamId, loading } = useCurrentUserRole();
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);
  const [groupSearch, setGroupSearch] = useState("");

  // Supervisor can only see their squad
  const isSupervisor = role === "SUPERVISOR";
  const effectiveTeamId = isSupervisor ? teamId : selectedSquadId;

  const { data: dbGrupos } = useGrupos();
  const { data: satSettings = [] } = useMonitoringSettings("SATISFACAO");
  const { data: scoreSettings = [] } = useMonitoringSettings("SCORE");
  const { data: statusSettings = [] } = useMonitoringSettings("STATUS");

  const allMetrics = useOperationalMetrics(null);
  const filteredMetrics = useOperationalMetrics(effectiveTeamId);

  // Dynamic color maps
  const satStyleMap = useMemo(() => {
    const map: Record<string, { background: string; color: string }> = { ...FALLBACK_SAT_STYLE };
    satSettings.forEach((s) => {
      if (s.color) map[s.label] = { background: s.color, color: isLightColor(s.color) ? "#000000" : "#ffffff" };
    });
    return map;
  }, [satSettings]);

  const statusStyleMap = useMemo(() => {
    const map: Record<string, { background: string; color: string }> = {};
    statusSettings.forEach((s) => {
      if (s.color) map[s.label] = { background: s.color, color: isLightColor(s.color) ? "#000000" : "#ffffff" };
    });
    return map;
  }, [statusSettings]);

  const scoreToSatisfacao = useMemo(() => {
    if (scoreSettings.length === 0) {
      return (score: number) => score >= 71 ? "Ótimo" : score >= 41 ? "Regular" : "Ruim";
    }
    return (score: number) => {
      for (const s of scoreSettings) {
        if (s.min_value !== null && s.max_value !== null && score >= s.min_value && score <= s.max_value) return s.label;
      }
      return "Regular";
    };
  }, [scoreSettings]);

  // Squad grupos for table
  const squadGrupos = useMemo(() => {
    if (!effectiveTeamId || !dbGrupos) return [];
    return dbGrupos
      .filter((g) => g.team_id === effectiveTeamId)
      .map((g) => {
        const score = g.mensagens > 0 ? Math.min(100, Math.round(g.mensagens / 3)) : 50;
        return {
          id: g.id,
          dataHora: g.ultima_atividade ?? "—",
          grupo: g.nome,
          gestorTrafego: g.gestor ?? "—",
          satisfacao: scoreToSatisfacao(score),
          score,
          status: g.status ?? "PENDENTE",
          descricao: `Grupo: ${g.nome}`,
        };
      });
  }, [dbGrupos, effectiveTeamId, scoreToSatisfacao]);

  const filteredGrupos = squadGrupos.filter(
    (row) =>
      row.grupo.toLowerCase().includes(groupSearch.toLowerCase()) ||
      row.gestorTrafego.toLowerCase().includes(groupSearch.toLowerCase()) ||
      row.status.toLowerCase().includes(groupSearch.toLowerCase())
  );

  if (loading) return null;

  // OPERACIONAL shouldn't access this page
  if (role === "OPERACIONAL") return <Navigate to="/" replace />;

  const squads = allMetrics.squadMetrics;
  const currentSquad = effectiveTeamId
    ? squads.find((s) => s.id === effectiveTeamId)
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LayoutGrid size={24} className="text-primary" />
            Painel por Squad
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isSupervisor ? "Visão do seu squad" : "Selecione um squad para visualizar"}
          </p>
        </div>

        {/* Squad selector for DIRETOR/GERENTE */}
        {!isSupervisor && (
          <Select
            value={selectedSquadId ?? "all"}
            onValueChange={(v) => setSelectedSquadId(v === "all" ? null : v)}
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Todos os Squads" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Squads</SelectItem>
              {squads.map((sq) => (
                <SelectItem key={sq.id} value={sq.id}>
                  {sq.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Squad overview cards - show when a specific squad is selected */}
      {currentSquad ? (
        <>
          {/* Back button */}
          {!isSupervisor && (
            <button
              onClick={() => setSelectedSquadId(null)}
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Voltar para todos os squads
            </button>
          )}

          {/* Squad header */}
          <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-foreground">{currentSquad.name}</h2>
                <p className="text-sm text-muted-foreground">
                  Supervisor: {currentSquad.supervisor || "Não definido"}
                </p>
              </div>
              <div className="w-64">
                <CapacityAlert
                  current={currentSquad.totalGrupos}
                  max={currentSquad.capacidadeMaxima}
                  label="Capacidade do Squad"
                />
              </div>
            </div>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Médio</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{currentSquad.scoreMedio}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="text-primary" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grupos Críticos</p>
                    <p className="text-3xl font-bold text-destructive mt-1">{currentSquad.gruposCriticos}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="text-destructive" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tempo Resposta</p>
                    <p className="text-3xl font-bold text-foreground mt-1">—</p>
                    <p className="text-[10px] text-muted-foreground">Em breve</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Clock className="text-primary" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alertas Ativos</p>
                    <p className="text-3xl font-bold text-foreground mt-1">{currentSquad.alertasAtivos}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-regular))]/10 flex items-center justify-center">
                    <AlertTriangle className="text-[hsl(var(--status-regular))]" size={20} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Gestores do Squad */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Users size={16} className="text-primary" />
                Gestores do Squad
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredMetrics.gestorMetrics.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">Nenhum gestor neste squad</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8">#</TableHead>
                      <TableHead>Gestor</TableHead>
                      <TableHead className="text-right">Score Médio</TableHead>
                      <TableHead className="text-right">Grupos</TableHead>
                      <TableHead className="text-right">Capacidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMetrics.gestorMetrics.map((gm, i) => (
                      <TableRow key={gm.userId || gm.name}>
                        <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                        <TableCell className="font-medium">{gm.name}</TableCell>
                        <TableCell className="text-right font-semibold">{gm.scoreMedio}</TableCell>
                        <TableCell className="text-right">{gm.totalGrupos}</TableCell>
                        <TableCell className="text-right">
                          <CapacityAlert current={gm.totalGrupos} max={gm.capacidadeMaxima} label="" compact />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Grupos do Squad - Monitoring Table */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between flex-wrap gap-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Shield size={16} className="text-primary" />
                  Grupos do Squad
                </CardTitle>
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Buscar grupo..."
                    value={groupSearch}
                    onChange={(e) => setGroupSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-56 transition-all"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden rounded-b-lg">
                <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
                  <colgroup>
                    <col style={{ width: "90px" }} />
                    <col style={{ width: "18%" }} />
                    <col style={{ width: "14%" }} />
                    <col style={{ width: "130px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "120px" }} />
                    <col />
                  </colgroup>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, paddingLeft: "20px" }}>DATA/HORA</th>
                      <th style={thStyle}>GRUPO</th>
                      <th style={thStyle}>GESTOR DE TRÁFEGO</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>SATISFAÇÃO</th>
                      <th style={{ ...thStyle, textAlign: "center" }}>SCORE</th>
                      <th style={thStyle}>STATUS</th>
                      <th style={thStyle}>DESCRIÇÃO</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrupos.length === 0 ? (
                      <tr>
                        <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                          Nenhum grupo encontrado neste squad.
                        </td>
                      </tr>
                    ) : (
                      filteredGrupos.map((row, idx) => {
                        const satStyle = satStyleMap[row.satisfacao] ?? { background: "#888", color: "#fff" };
                        const stsStyle = statusStyleMap[row.status];
                        const isLast = idx === filteredGrupos.length - 1;
                        const borderStyle = isLast ? "none" : "1px solid hsl(var(--border))";

                        return (
                          <tr key={row.id} style={{ height: "56px" }}>
                            <td style={{ ...tdBase, paddingLeft: "20px", borderBottom: borderStyle }}>
                              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", whiteSpace: "pre-line", lineHeight: 1.4 }}>
                                {row.dataHora}
                              </p>
                            </td>
                            <td style={{ ...tdBase, borderBottom: borderStyle }}>
                              <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.grupo}
                              </p>
                            </td>
                            <td style={{ ...tdBase, borderBottom: borderStyle }}>
                              <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {row.gestorTrafego}
                              </p>
                            </td>
                            <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                              <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                                {row.satisfacao}
                              </div>
                            </td>
                            <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                              <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                                {row.score}
                              </div>
                            </td>
                            <td style={{ ...tdBase, borderBottom: borderStyle }}>
                              {stsStyle ? (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", fontSize: "11px", fontWeight: 600,
                                  letterSpacing: "0.04em", color: stsStyle.color, background: stsStyle.background,
                                  padding: "2px 8px", borderRadius: "4px", whiteSpace: "nowrap",
                                }}>
                                  {row.status}
                                </span>
                              ) : (
                                <span style={{
                                  display: "inline-flex", alignItems: "center", fontSize: "11px", fontWeight: 500,
                                  letterSpacing: "0.04em", color: "hsl(var(--foreground))", whiteSpace: "nowrap",
                                }}>
                                  {row.status}
                                </span>
                              )}
                            </td>
                            <td style={{ ...tdBase, borderBottom: borderStyle }}>
                              <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                "{row.descricao}"
                              </p>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
                <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
                  {filteredGrupos.length} de {squadGrupos.length} registros exibidos
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      ) : (
        /* All squads overview */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {squads.length === 0 ? (
            <p className="text-muted-foreground col-span-full text-center py-8">Nenhum squad cadastrado</p>
          ) : (
            squads.map((sq, i) => (
              <Card
                key={sq.id}
                className="cursor-pointer hover:border-primary/40 transition-colors"
                onClick={() => setSelectedSquadId(sq.id)}
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                        <h3 className="font-semibold text-foreground">{sq.name}</h3>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Supervisor: {sq.supervisor || "—"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-foreground">{sq.scoreMedio}</p>
                      <p className="text-[10px] text-muted-foreground uppercase">Score</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">{sq.gruposAtivos}</p>
                      <p className="text-[10px] text-muted-foreground">Grupos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-destructive">{sq.gruposCriticos}</p>
                      <p className="text-[10px] text-muted-foreground">Críticos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">{sq.gestores.length}</p>
                      <p className="text-[10px] text-muted-foreground">Gestores</p>
                    </div>
                  </div>

                  <CapacityAlert
                    current={sq.totalGrupos}
                    max={sq.capacidadeMaxima}
                    label="Capacidade"
                  />
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default Squads;
