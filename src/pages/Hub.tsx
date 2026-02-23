import { useState, useMemo } from "react";
import { Shield, Search, Users, AlertTriangle, TrendingUp } from "lucide-react";
import { useGrupos } from "@/hooks/useGrupos";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Navigate } from "react-router-dom";
type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type HubStatus   = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

interface GrupoRow {
  id: string;
  dataHora: string;
  grupo: string;
  gestor: string;
  squad: string;
  satisfacao: Satisfacao;
  score: number;
  status: HubStatus;
  descricao: string;
}

const MOCK_GRUPOS: GrupoRow[] = [
  { id: "mock-1", dataHora: "27/12/2026\n05:15", grupo: "Dr. Silva Advocacia",  gestor: "Seu Madruga", squad: "SQT1", satisfacao: "Ótimo",   score: 98, status: "RESOLVIDO", descricao: '"Cliente confirmou recebimento do parecer."' },
  { id: "mock-2", dataHora: "27/12/2026\n05:30", grupo: "Mendes & Associados",  gestor: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 62, status: "PENDENTE",  descricao: '"Cliente pediu atualização dos honorários."' },
  { id: "mock-3", dataHora: "27/12/2026\n05:45", grupo: "Dra. Paula Oliveira",  gestor: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 28, status: "CRÍTICO",   descricao: '"Cliente reclamou falta de posicionamento."' },
  { id: "mock-4", dataHora: "27/12/2026\n06:08", grupo: "Advogados SP",         gestor: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 58, status: "PENDENTE",  descricao: '"Cliente analisando proposta."' },
  { id: "mock-5", dataHora: "27/12/2026\n06:15", grupo: "Santos Jurídica",      gestor: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 22, status: "CRÍTICO",   descricao: '"4 mensagens sem retorno."' },
];

const SAT_STYLE: Record<Satisfacao, { background: string; color: string }> = {
  Ótimo:   { background: "#22c55e", color: "#ffffff" },
  Regular: { background: "#facc15", color: "#000000" },
  Ruim:    { background: "#ef4444", color: "#ffffff" },
};

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

function mapStatusToSatisfacao(status: string): Satisfacao {
  if (status === "RESOLVIDO") return "Ótimo";
  if (status === "CRÍTICO") return "Ruim";
  return "Regular";
}

function statusToScore(status: string): number {
  if (status === "RESOLVIDO") return Math.floor(Math.random() * 15) + 85;
  if (status === "CRÍTICO") return Math.floor(Math.random() * 20) + 15;
  return Math.floor(Math.random() * 20) + 45;
}

export default function Hub() {
  const { data: dbGrupos } = useGrupos();
  const { role, userName, loading: roleLoading } = useCurrentUserRole();
  const [search, setSearch] = useState("");

  // GERENTE não acessa Hub
  if (!roleLoading && role === "GERENTE") {
    return <Navigate to="/" replace />;
  }

  const displayName = userName ?? "Colaborador";

  const GRUPOS = useMemo((): GrupoRow[] => {
    if (dbGrupos && dbGrupos.length > 0) {
      return dbGrupos.map((g) => ({
        id: g.id,
        dataHora: g.ultima_atividade ?? "—",
        grupo: g.nome,
        gestor: g.gestor ?? "—",
        squad: "—",
        satisfacao: mapStatusToSatisfacao(g.status),
        score: g.mensagens > 0 ? Math.min(100, Math.round(g.mensagens / 3)) : statusToScore(g.status),
        status: (g.status as HubStatus) ?? "PENDENTE",
        descricao: `"Grupo: ${g.nome}"`,
      }));
    }
    return MOCK_GRUPOS;
  }, [dbGrupos]);

  const totalGrupos = GRUPOS.length;
  const criticos    = GRUPOS.filter((g) => g.status === "CRÍTICO").length;
  const scoreMedia  = GRUPOS.length > 0 ? Math.round(GRUPOS.reduce((a, g) => a + g.score, 0) / GRUPOS.length) : 0;
  const resolvidos  = GRUPOS.filter((g) => g.status === "RESOLVIDO").length;

  const filtered = GRUPOS.filter(
    (g) =>
      g.grupo.toLowerCase().includes(search.toLowerCase()) ||
      g.gestor.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* ── Hero Banner ── */}
      <div
        className="rounded-2xl px-8 py-7"
        style={{ background: "linear-gradient(135deg, #3b5bdb 0%, #6741d9 100%)" }}
      >
        <h1 className="text-3xl font-extrabold text-white mb-1">Olá, {displayName}!</h1>
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
              <p className="text-2xl font-bold text-foreground mt-0.5">{card.value}</p>
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
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "90px" }} />
              <col style={{ width: "18%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "60px" }} />
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
                <th style={thStyle}>SQUAD</th>
                <th style={{ ...thStyle, textAlign: "center" }}>SATISFAÇÃO</th>
                <th style={{ ...thStyle, textAlign: "center" }}>SCORE</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>DESCRIÇÃO</th>
              </tr>
            </thead>

            <tbody>
              {filtered.map((row, idx) => {
                const satStyle = SAT_STYLE[row.satisfacao];
                const isLast = idx === filtered.length - 1;
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
                        {row.gestor}
                      </p>
                    </td>
                    <td style={{ ...tdBase, borderBottom: borderStyle }}>
                      <p style={{ fontSize: "13px", fontWeight: 500, color: "hsl(var(--foreground))" }}>
                        {row.squad}
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
                      <span style={{
                        display: "inline-flex",
                        alignItems: "center",
                        fontSize: "11px",
                        fontWeight: 500,
                        letterSpacing: "0.04em",
                        color: "hsl(var(--foreground))",
                        whiteSpace: "nowrap",
                      }}>
                        {row.status}
                      </span>
                    </td>
                    <td style={{ ...tdBase, borderBottom: borderStyle }}>
                      <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {row.descricao}
                      </p>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                    Nenhum grupo encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
