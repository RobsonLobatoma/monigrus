import { useState } from "react";
import { Shield, Search, Users, AlertTriangle, TrendingUp, Loader2 } from "lucide-react";
import { useGrupos } from "@/hooks/useGrupos";

type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type HubStatus   = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

const SAT_STYLE: Record<Satisfacao, { background: string; color: string }> = {
  Ótimo:   { background: "#22c55e", color: "#ffffff" },
  Regular: { background: "#facc15", color: "#000000" },
  Ruim:    { background: "#ef4444", color: "#ffffff" },
};

function scoreToSatisfacao(score: number): Satisfacao {
  if (score >= 80) return "Ótimo";
  if (score >= 50) return "Regular";
  return "Ruim";
}

function statusToHubStatus(status: string): HubStatus {
  const s = status?.toUpperCase();
  if (s === "RESOLVIDO") return "RESOLVIDO";
  if (s === "CRÍTICO" || s === "CRITICO") return "CRÍTICO";
  return "PENDENTE";
}

const thStyle: React.CSSProperties = {
  padding: "12px 12px",
  textAlign: "left",
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "hsl(var(--muted-foreground))",
  boxSizing: "border-box",
  borderBottom: "1px solid hsl(var(--border))",
  whiteSpace: "nowrap",
};

const tdBase: React.CSSProperties = {
  padding: "0 12px",
  verticalAlign: "middle",
  height: "56px",
  boxSizing: "border-box",
  borderBottom: "1px solid hsl(var(--border))",
};

const tdColoredOuter: React.CSSProperties = {
  padding: 0,
  height: "56px",
  boxSizing: "border-box",
  borderBottom: "1px solid hsl(var(--border))",
};

const cellFill: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: "56px",
  width: "100%",
  fontWeight: 600,
  fontSize: "13px",
};

export default function Hub() {
  const [search, setSearch] = useState("");
  const { data: grupos = [], isLoading } = useGrupos();

  // Calcular métricas dinamicamente
  const totalGrupos = grupos.length;
  const criticos    = grupos.filter((g) => statusToHubStatus(g.status) === "CRÍTICO").length;
  const resolvidos  = grupos.filter((g) => statusToHubStatus(g.status) === "RESOLVIDO").length;
  const scoreMedia  = totalGrupos > 0
    ? Math.round(grupos.reduce((acc, g) => acc + (g.mensagens > 0 ? Math.max(0, 100 - g.mensagens) : 100), 0) / totalGrupos)
    : 0;

  const filtered = grupos.filter(
    (g) =>
      g.nome.toLowerCase().includes(search.toLowerCase()) ||
      (g.gestor ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ── */}
      <div
        className="rounded-2xl px-8 py-7"
        style={{ background: "linear-gradient(135deg, #3b5bdb 0%, #6741d9 100%)" }}
      >
        <h1 className="text-3xl font-extrabold text-white mb-1">Olá, Dr. Ricardo!</h1>
        <p className="text-white/80 text-base mb-3">Estes são os grupos sob sua responsabilidade direta.</p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
          Seu desempenho impacta diretamente o score da unidade.
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MEUS GRUPOS",  value: totalGrupos,     sub: "grupos monitorados",    icon: <Users size={18} className="text-primary" />,        accent: "bg-primary/10" },
          { label: "CRÍTICOS",     value: criticos,         sub: "requerem atenção",      icon: <AlertTriangle size={18} className="text-red-500" />, accent: "bg-red-500/10" },
          { label: "SCORE MÉDIO",  value: `${scoreMedia}`,  sub: "pontuação da carteira", icon: <TrendingUp size={18} className="text-green-500" />, accent: "bg-green-500/10" },
          { label: "RESOLVIDOS",   value: resolvidos,       sub: "neste ciclo",           icon: <Shield size={18} className="text-blue-500" />,      accent: "bg-blue-500/10" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${card.accent} flex items-center justify-center`}>{card.icon}</div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{card.label}</p>
              {isLoading
                ? <div className="h-8 w-12 bg-muted animate-pulse rounded mt-0.5" />
                : <p className="text-2xl font-bold text-foreground mt-0.5">{card.value}</p>
              }
              <p className="text-xs text-muted-foreground mt-0.5">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Painel de Monitoramento (PESSOAL) ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-primary" />
            <h2 className="text-base font-bold text-foreground">Painel de Monitoramento (PESSOAL)</h2>
          </div>
          <div className="relative w-60">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar grupo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
              <Loader2 size={20} className="animate-spin" />
              <span className="text-sm">Carregando grupos...</span>
            </div>
          ) : (
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "18%" }} />
                <col style={{ width: "14%" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "130px" }} />
                <col style={{ width: "80px" }} />
                <col style={{ width: "120px" }} />
                <col />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ ...thStyle, paddingLeft: "20px" }}>GRUPO</th>
                  <th style={thStyle}>GESTOR DE TRÁFEGO</th>
                  <th style={thStyle}>SQUAD</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>SATISFAÇÃO</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>SCORE</th>
                  <th style={thStyle}>STATUS</th>
                  <th style={thStyle}>SLA</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                      {grupos.length === 0
                        ? "Nenhum grupo cadastrado. Adicione grupos em Configurações."
                        : "Nenhum grupo encontrado."}
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => {
                    const score = Math.max(0, 100 - (row.mensagens ?? 0));
                    const satisfacao = scoreToSatisfacao(score);
                    const hubStatus = statusToHubStatus(row.status);
                    const satStyle = SAT_STYLE[satisfacao];
                    const isLast = idx === filtered.length - 1;
                    const borderStyle = isLast ? "none" : "1px solid hsl(var(--border))";

                    return (
                      <tr key={row.id} style={{ height: "56px" }}>
                        <td style={{ ...tdBase, paddingLeft: "20px", borderBottom: borderStyle }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.nome}
                          </p>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.gestor ?? "—"}
                          </p>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                            {row.team_id ? row.team_id.slice(0, 6) : "—"}
                          </span>
                        </td>
                        <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                          <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                            {satisfacao}
                          </div>
                        </td>
                        <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                          <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                            {score}
                          </div>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{ fontSize: "11px", fontWeight: 500, letterSpacing: "0.04em", color: "#111827", whiteSpace: "nowrap" }}>
                            {hubStatus}
                          </span>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            padding: "2px 8px",
                            borderRadius: "4px",
                            background: row.sla === "DENTRO DO SLA" ? "hsl(142 76% 90%)" : "hsl(0 84% 93%)",
                            color: row.sla === "DENTRO DO SLA" ? "hsl(142 76% 30%)" : "hsl(0 84% 40%)",
                          }}>
                            {row.sla}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
