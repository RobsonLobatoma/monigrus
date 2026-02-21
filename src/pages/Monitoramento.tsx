import { useState, useMemo } from "react";
import { Shield, Search } from "lucide-react";
import { useGrupos } from "@/hooks/useGrupos";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Navigate } from "react-router-dom";
type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type StatusType = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

interface MonitoringRow {
  id: string;
  dataHora: string;
  grupo: string;
  gestorTrafego: string;
  squad: string;
  satisfacao: Satisfacao;
  score: number;
  status: StatusType;
  descricao: string;
}

const mockData: MonitoringRow[] = [
  { id: "mock-1", dataHora: "27/12/2026\n05:15", grupo: "Dr. Silva Advocacia",    gestorTrafego: "Seu Madruga", squad: "SQT1", satisfacao: "Ótimo",   score: 98, status: "RESOLVIDO", descricao: "Cliente confirmou recebimento do parecer." },
  { id: "mock-2", dataHora: "27/12/2026\n05:30", grupo: "Mendes & Associados",    gestorTrafego: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 62, status: "PENDENTE",  descricao: "Cliente pediu atualização dos honorários." },
  { id: "mock-3", dataHora: "27/12/2026\n05:45", grupo: "Dra. Paula Oliveira",    gestorTrafego: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 28, status: "CRÍTICO",   descricao: "Cliente reclamou falta de posicionamento." },
  { id: "mock-4", dataHora: "27/12/2026\n06:00", grupo: "Advogados SP",           gestorTrafego: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 58, status: "PENDENTE",  descricao: "Cliente analisando proposta." },
  { id: "mock-5", dataHora: "27/12/2026\n06:15", grupo: "Santos Jurídica",        gestorTrafego: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 22, status: "CRÍTICO",   descricao: "4 mensagens sem retorno." },
  { id: "mock-6", dataHora: "27/12/2026\n06:30", grupo: "Lima & Ferreira",        gestorTrafego: "Ana Costa",   squad: "SQT1", satisfacao: "Ótimo",   score: 91, status: "RESOLVIDO", descricao: "Acordo firmado com sucesso." },
  { id: "mock-7", dataHora: "27/12/2026\n06:45", grupo: "Carvalho Consultoria",   gestorTrafego: "Seu Madruga", squad: "SQT2", satisfacao: "Regular", score: 55, status: "PENDENTE",  descricao: "Aguardando documentação complementar." },
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
};

const tdColoredOuter: React.CSSProperties = {
  padding: 0,
  height: "56px",
  boxSizing: "border-box",
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

export default function Monitoramento() {
  const { data: dbGrupos } = useGrupos();
  const { role, teamId: currentTeamId, loading: roleLoading } = useCurrentUserRole();
  const [search, setSearch] = useState("");

  // OPERACIONAL não acessa Monitoramento
  if (!roleLoading && role === "OPERACIONAL") {
    return <Navigate to="/" replace />;
  }

  const data = useMemo((): MonitoringRow[] => {
    if (dbGrupos && dbGrupos.length > 0) {
      return dbGrupos.map((g) => ({
        id: g.id,
        dataHora: g.ultima_atividade ?? "—",
        grupo: g.nome,
        gestorTrafego: g.gestor ?? "—",
        squad: "—",
        satisfacao: mapStatusToSatisfacao(g.status),
        score: g.mensagens > 0 ? Math.min(100, Math.round(g.mensagens / 3)) : 50,
        status: (g.status as StatusType) ?? "PENDENTE",
        descricao: `Grupo: ${g.nome}`,
      }));
    }
    return mockData;
  }, [dbGrupos]);

  const filtered = data.filter(
    (row) =>
      row.grupo.toLowerCase().includes(search.toLowerCase()) ||
      row.gestorTrafego.toLowerCase().includes(search.toLowerCase()) ||
      row.squad.toLowerCase().includes(search.toLowerCase()) ||
      row.status.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Shield className="text-primary" size={26} />
          <h1 className="text-2xl font-bold text-foreground">
            Painel de Monitoramento{" "}
            <span className="text-muted-foreground font-medium text-xl">(GLOBAL)</span>
          </h1>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-64 transition-all"
          />
        </div>
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
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
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
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
                        {row.gestorTrafego}
                      </p>
                    </td>
                    <td style={{ ...tdBase, borderBottom: borderStyle }}>
                      <span style={{ fontSize: "12px", fontWeight: 500, color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                        {row.squad}
                      </span>
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
                        color: "#111827",
                        whiteSpace: "nowrap",
                      }}>
                        {row.status}
                      </span>
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

        {/* Footer count */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} de {data.length} registros exibidos
        </div>
      </div>
    </div>
  );
}
