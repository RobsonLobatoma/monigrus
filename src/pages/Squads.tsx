import { useState } from "react";
import {
  LayoutGrid,
  Users,
  AlertTriangle,
  TrendingUp,
  Clock,
  Trophy,
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
import { CapacityAlert } from "@/components/CapacityAlert";
import { Navigate } from "react-router-dom";

const Squads = () => {
  const { role, teamId, loading } = useCurrentUserRole();
  const [selectedSquadId, setSelectedSquadId] = useState<string | null>(null);

  // Supervisor can only see their squad
  const isSupervisor = role === "SUPERVISOR";
  const effectiveTeamId = isSupervisor ? teamId : selectedSquadId;

  const allMetrics = useOperationalMetrics(null);
  const filteredMetrics = useOperationalMetrics(effectiveTeamId);

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
