import { useMemo } from "react";
import {
  Monitor,
  TrendingUp,
  Users,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Trophy,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useOperationalMetrics } from "@/hooks/useOperationalMetrics";
import { CapacityAlert } from "@/components/CapacityAlert";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const ROLE_LABEL: Record<string, string> = {
  DIRETOR: "Diretor",
  GERENTE: "Gerente",
  SUPERVISOR: "Supervisor",
  OPERACIONAL: "Operacional",
};

const Index = () => {
  const { role, userName, teamId } = useCurrentUserRole();

  // Supervisor sees only their squad
  const filterTeamId = role === "SUPERVISOR" ? teamId : null;
  const metrics = useOperationalMetrics(filterTeamId);

  // Fake historical data from current status distribution
  const historyData = useMemo(() => {
    const days = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    const base = metrics.scoreMedioGlobal || 50;
    return days.map((d, i) => ({
      day: d,
      score: Math.max(0, Math.min(100, base + Math.round((Math.random() - 0.5) * 20 - i * 2))),
    }));
  }, [metrics.scoreMedioGlobal]);

  // Risk distribution
  const riskData = useMemo(() => {
    return Object.entries(metrics.statusDistribution).map(([name, value]) => ({ name, value }));
  }, [metrics.statusDistribution]);

  const RISK_COLORS: Record<string, string> = {
    RESOLVIDO: "hsl(var(--status-resolvido))",
    PENDENTE: "hsl(var(--status-pendente))",
    CRÍTICO: "hsl(var(--status-critico))",
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 p-6">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {userName || "Usuário"} 👋
        </h1>
        <p className="text-muted-foreground mt-1">
          {ROLE_LABEL[role] || role} — Dashboard Executivo
          {filterTeamId ? " (visão do seu squad)" : " (visão global)"}
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Score Médio</p>
                <p className="text-3xl font-bold text-foreground mt-1">{metrics.scoreMedioGlobal}</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Grupos Ativos</p>
                <p className="text-3xl font-bold text-foreground mt-1">{metrics.totalGruposAtivos}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="text-primary" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alertas Críticos</p>
                <p className="text-3xl font-bold text-destructive mt-1">{metrics.alertasCriticos}</p>
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
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Taxa Resolução</p>
                <p className="text-3xl font-bold text-foreground mt-1">{metrics.taxaResolucao}%</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-[hsl(var(--status-resolvido))]/10 flex items-center justify-center">
                <CheckCircle className="text-[hsl(var(--status-resolvido))]" size={20} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Score History */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp size={16} className="text-primary" />
              Score Histórico
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={historyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--primary))"
                  fill="hsl(var(--primary))"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Risk Trend */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <BarChart3 size={16} className="text-primary" />
              Distribuição de Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={riskData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {riskData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={RISK_COLORS[entry.name] || "hsl(var(--muted))"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Rankings Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Squad Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Trophy size={16} className="text-primary" />
              Ranking de Squads
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.squadMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum squad cadastrado</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Squad</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Grupos</TableHead>
                    <TableHead className="text-right">Capacidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.squadMetrics.slice(0, 10).map((sq, i) => (
                    <TableRow key={sq.id}>
                      <TableCell className="font-bold text-muted-foreground">{i + 1}</TableCell>
                      <TableCell className="font-medium">{sq.name}</TableCell>
                      <TableCell className="text-right font-semibold">{sq.scoreMedio}</TableCell>
                      <TableCell className="text-right">{sq.totalGrupos}</TableCell>
                      <TableCell className="text-right">
                        <CapacityAlert current={sq.totalGrupos} max={sq.capacidadeMaxima} label="" compact />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Gestor Ranking */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users size={16} className="text-primary" />
              Ranking de Gestores
            </CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.gestorMetrics.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">Nenhum gestor com grupos atribuídos</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Gestor</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Grupos</TableHead>
                    <TableHead className="text-right">Capacidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {metrics.gestorMetrics.slice(0, 10).map((gm, i) => (
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
      </div>

      {/* Latest Anomalias */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle size={16} className="text-destructive" />
            Últimas Anomalias
          </CardTitle>
        </CardHeader>
        <CardContent>
          {metrics.latestAnomalias.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Nenhuma anomalia registrada</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Detalhes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {metrics.latestAnomalias.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="text-sm">
                      {new Date(a.occurred_at).toLocaleDateString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-sm font-medium">{a.grupo_id?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell className="text-sm">{a.team_id?.slice(0, 8) ?? "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {JSON.stringify(a.payload).slice(0, 60)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
