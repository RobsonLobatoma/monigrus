import { useState } from "react";
import { Shield, Search, Loader2 } from "lucide-react";
import { useGrupos } from "@/hooks/useGrupos";

type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type StatusType = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

function scoreToSatisfacao(mensagens: number): Satisfacao {
  const score = Math.max(0, 100 - mensagens);
  if (score >= 80) return "Ótimo";
  if (score >= 50) return "Regular";
  return "Ruim";
}

function toStatus(s: string): StatusType {
  const up = s?.toUpperCase();
  if (up === "RESOLVIDO") return "RESOLVIDO";
  if (up === "CRÍTICO" || up === "CRITICO") return "CRÍTICO";
  return "PENDENTE";
}

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

export default function Monitoramento() {
  const [search, setSearch] = useState("");
  const { data: grupos = [], isLoading } = useGrupos();

  const filtered = grupos.filter(
    (g) =>
      g.nome.toLowerCase().includes(search.toLowerCase()) ||
      (g.gestor ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.sla ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (g.status ?? "").toLowerCase().includes(search.toLowerCase())
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
        {isLoading ? (
          <div className="flex items-center justify-center py-16 gap-3 text-muted-foreground">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Carregando dados de monitoramento...</span>
          </div>
        ) : (
          <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
            <colgroup>
              <col style={{ width: "20%" }} />
              <col style={{ width: "14%" }} />
              <col style={{ width: "130px" }} />
              <col style={{ width: "80px" }} />
              <col style={{ width: "120px" }} />
              <col style={{ width: "140px" }} />
              <col />
            </colgroup>

            <thead>
              <tr>
                <th style={{ ...thStyle, paddingLeft: "20px" }}>GRUPO</th>
                <th style={thStyle}>GESTOR DE TRÁFEGO</th>
                <th style={{ ...thStyle, textAlign: "center" }}>SATISFAÇÃO</th>
                <th style={{ ...thStyle, textAlign: "center" }}>SCORE</th>
                <th style={thStyle}>STATUS</th>
                <th style={thStyle}>SLA</th>
                <th style={thStyle}>ÚLTIMA ATIVIDADE</th>
              </tr>
            </thead>

            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                    {grupos.length === 0
                      ? "Nenhum grupo cadastrado. Adicione grupos em Configurações para monitorá-los aqui."
                      : "Nenhum resultado encontrado."}
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const satisfacao = scoreToSatisfacao(row.mensagens ?? 0);
                  const score = Math.max(0, 100 - (row.mensagens ?? 0));
                  const status = toStatus(row.status);
                  const satStyle = SAT_STYLE[satisfacao];
                  const isLast = idx === filtered.length - 1;
                  const borderStyle = isLast ? "none" : "1px solid hsl(var(--border))";

                  return (
                    <tr key={row.id} style={{ height: "56px" }}>
                      {/* GRUPO */}
                      <td style={{ ...tdBase, paddingLeft: "20px", borderBottom: borderStyle }}>
                        <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.nome}
                        </p>
                      </td>

                      {/* GESTOR */}
                      <td style={{ ...tdBase, borderBottom: borderStyle }}>
                        <p style={{ fontSize: "13px", color: "hsl(var(--muted-foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {row.gestor ?? "—"}
                        </p>
                      </td>

                      {/* SATISFAÇÃO */}
                      <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                        <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                          {satisfacao}
                        </div>
                      </td>

                      {/* SCORE */}
                      <td style={{ ...tdColoredOuter, borderBottom: borderStyle }}>
                        <div style={{ ...cellFill, background: satStyle.background, color: satStyle.color }}>
                          {score}
                        </div>
                      </td>

                      {/* STATUS */}
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
                          {status}
                        </span>
                      </td>

                      {/* SLA */}
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

                      {/* ÚLTIMA ATIVIDADE */}
                      <td style={{ ...tdBase, borderBottom: borderStyle }}>
                        <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", whiteSpace: "pre-line", lineHeight: 1.4 }}>
                          {row.ultima_atividade ?? "—"}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}

        {/* Footer count */}
        {!isLoading && (
          <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
            {filtered.length} de {grupos.length} registros exibidos
          </div>
        )}
      </div>
    </div>
  );
}
