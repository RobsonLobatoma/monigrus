import { useState, useMemo } from "react";
import { AlertTriangle, Search, Filter, ArrowUpDown } from "lucide-react";
import { useAnomalias, type Anomalia } from "@/hooks/useAnomalias";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { Navigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

type SortField = "occurred_at" | "tipo" | "severidade" | "grupo";
type SortDir = "asc" | "desc";

const SEVERITY_ORDER: Record<string, number> = {
  CRITICA: 0,
  ALTA: 1,
  MEDIA: 2,
  BAIXA: 3,
};

const SEVERITY_STYLES: Record<string, { bg: string; text: string }> = {
  CRITICA: { bg: "hsl(0 84% 55%)", text: "#fff" },
  ALTA: { bg: "hsl(25 95% 53%)", text: "#fff" },
  MEDIA: { bg: "hsl(38 90% 50%)", text: "#000" },
  BAIXA: { bg: "hsl(145 63% 42%)", text: "#fff" },
};

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  ABERTA: { bg: "hsl(0 84% 55%)", text: "#fff" },
  EM_PROGRESSO: { bg: "hsl(38 90% 50%)", text: "#000" },
  RESOLVIDA: { bg: "hsl(145 63% 42%)", text: "#fff" },
  FECHADA: { bg: "hsl(215 16% 47%)", text: "#fff" },
};

const TYPE_LABELS: Record<string, string> = {
  CHURN: "Churn",
  SLA_FAIL: "Falha SLA",
  PENDING_REVIEW: "Revisão Pendente",
  CRITICAL_SCORE: "Score Crítico",
  MANUAL: "Manual",
};

/* Mock data for when the DB is empty */
const mockData: Anomalia[] = [
  {
    id: "mock-1",
    payload: { tipo: "CHURN", severidade: "CRITICA", status: "ABERTA", descricao: "Cliente sem resposta há 72h no grupo Dr. Silva Advocacia." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-23T08:30:00Z", created_at: "2026-02-23T08:30:00Z", updated_at: "2026-02-23T08:30:00Z",
    grupo_nome: "Dr. Silva Advocacia", team_name: "SQT1", sector_name: "Jurídico",
  },
  {
    id: "mock-2",
    payload: { tipo: "SLA_FAIL", severidade: "ALTA", status: "EM_PROGRESSO", descricao: "SLA estourado: tempo de resposta acima de 4h no grupo Mendes & Associados." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-23T07:15:00Z", created_at: "2026-02-23T07:15:00Z", updated_at: "2026-02-23T07:15:00Z",
    grupo_nome: "Mendes & Associados", team_name: "SQT2", sector_name: "Jurídico",
  },
  {
    id: "mock-3",
    payload: { tipo: "CRITICAL_SCORE", severidade: "CRITICA", status: "ABERTA", descricao: "Score do grupo caiu para 15 pontos. Risco de churn iminente." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-23T06:45:00Z", created_at: "2026-02-23T06:45:00Z", updated_at: "2026-02-23T06:45:00Z",
    grupo_nome: "Dra. Paula Oliveira", team_name: "SQT3", sector_name: "Financeiro",
  },
  {
    id: "mock-4",
    payload: { tipo: "PENDING_REVIEW", severidade: "MEDIA", status: "ABERTA", descricao: "3 grupos sem revisão diária pelo gestor responsável." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-22T18:00:00Z", created_at: "2026-02-22T18:00:00Z", updated_at: "2026-02-22T18:00:00Z",
    grupo_nome: "Advogados SP", team_name: "SQT2", sector_name: "Jurídico",
  },
  {
    id: "mock-5",
    payload: { tipo: "MANUAL", severidade: "BAIXA", status: "RESOLVIDA", descricao: "Gestor registrou reclamação pontual do cliente sobre prazo." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-22T14:30:00Z", created_at: "2026-02-22T14:30:00Z", updated_at: "2026-02-22T14:30:00Z",
    grupo_nome: "Santos Jurídica", team_name: "SQT3", sector_name: "Financeiro",
  },
  {
    id: "mock-6",
    payload: { tipo: "SLA_FAIL", severidade: "ALTA", status: "FECHADA", descricao: "SLA restabelecido após intervenção do supervisor." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-22T11:00:00Z", created_at: "2026-02-22T11:00:00Z", updated_at: "2026-02-22T11:00:00Z",
    grupo_nome: "Lima & Ferreira", team_name: "SQT1", sector_name: "Jurídico",
  },
  {
    id: "mock-7",
    payload: { tipo: "CHURN", severidade: "MEDIA", status: "EM_PROGRESSO", descricao: "Cliente demonstrou insatisfação com tempo de retorno." },
    user_id: null, grupo_id: null, team_id: null, sector_id: null,
    occurred_at: "2026-02-21T16:45:00Z", created_at: "2026-02-21T16:45:00Z", updated_at: "2026-02-21T16:45:00Z",
    grupo_nome: "Carvalho Consultoria", team_name: "SQT2", sector_name: "Financeiro",
  },
];

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
  cursor: "pointer",
  userSelect: "none",
};

const tdBase: React.CSSProperties = {
  padding: "0 12px",
  verticalAlign: "middle",
  height: "56px",
  boxSizing: "border-box",
};

function extractAnomalia(a: Anomalia) {
  return {
    tipo: (a.payload as any)?.tipo ?? "MANUAL",
    severidade: (a.payload as any)?.severidade ?? "MEDIA",
    status: (a.payload as any)?.status ?? "ABERTA",
    descricao: (a.payload as any)?.descricao ?? "—",
  };
}

export default function Anomalias() {
  const { data: dbAnomalias, isLoading } = useAnomalias();
  const { role, loading: roleLoading } = useCurrentUserRole();

  const [search, setSearch] = useState("");
  const [filterSeveridade, setFilterSeveridade] = useState<string>("TODAS");
  const [filterStatus, setFilterStatus] = useState<string>("TODOS");
  const [sortField, setSortField] = useState<SortField>("occurred_at");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const data = useMemo(() => {
    if (dbAnomalias && dbAnomalias.length > 0) return dbAnomalias;
    return mockData;
  }, [dbAnomalias]);

  const filtered = useMemo(() => {
    let result = data.filter((a) => {
      const { tipo, severidade, status, descricao } = extractAnomalia(a);
      const matchSearch =
        search === "" ||
        (a.grupo_nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (a.team_name ?? "").toLowerCase().includes(search.toLowerCase()) ||
        descricao.toLowerCase().includes(search.toLowerCase()) ||
        tipo.toLowerCase().includes(search.toLowerCase());
      const matchSeveridade = filterSeveridade === "TODAS" || severidade === filterSeveridade;
      const matchStatus = filterStatus === "TODOS" || status === filterStatus;
      return matchSearch && matchSeveridade && matchStatus;
    });

    result.sort((a, b) => {
      const ea = extractAnomalia(a);
      const eb = extractAnomalia(b);
      let cmp = 0;
      switch (sortField) {
        case "occurred_at":
          cmp = new Date(a.occurred_at).getTime() - new Date(b.occurred_at).getTime();
          break;
        case "tipo":
          cmp = ea.tipo.localeCompare(eb.tipo);
          break;
        case "severidade":
          cmp = (SEVERITY_ORDER[ea.severidade] ?? 99) - (SEVERITY_ORDER[eb.severidade] ?? 99);
          break;
        case "grupo":
          cmp = (a.grupo_nome ?? "").localeCompare(b.grupo_nome ?? "");
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return result;
  }, [data, search, filterSeveridade, filterStatus, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const summary = useMemo(() => {
    const total = data.length;
    const criticas = data.filter((a) => extractAnomalia(a).severidade === "CRITICA").length;
    const abertas = data.filter((a) => extractAnomalia(a).status === "ABERTA").length;
    const resolvidas = data.filter((a) => extractAnomalia(a).status === "RESOLVIDA" || extractAnomalia(a).status === "FECHADA").length;
    return { total, criticas, abertas, resolvidas };
  }, [data]);

  const formatDate = (iso: string) => {
    try {
      return format(new Date(iso), "dd/MM/yyyy HH:mm", { locale: ptBR });
    } catch {
      return iso;
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => (
    <ArrowUpDown
      size={12}
      className={`inline ml-1 ${sortField === field ? "opacity-100" : "opacity-40"}`}
    />
  );

  // OPERACIONAL não acessa Anomalias
  if (!roleLoading && role === "OPERACIONAL") {
    return <Navigate to="/" replace />;
  }

  const summaryCards = [
    { label: "Total", value: summary.total, color: "hsl(var(--primary))", bgClass: "bg-primary/15 text-primary", icon: <AlertTriangle size={14} /> },
    { label: "Críticas", value: summary.criticas, color: "hsl(var(--destructive))", bgClass: "bg-destructive/15 text-destructive", icon: <AlertTriangle size={14} /> },
    { label: "Abertas", value: summary.abertas, color: "hsl(38 90% 50%)", bgClass: "bg-yellow-500/15 text-yellow-600", icon: <AlertTriangle size={14} /> },
    { label: "Resolvidas", value: summary.resolvidas, color: "hsl(145 63% 42%)", bgClass: "bg-green-500/15 text-green-600", icon: <AlertTriangle size={14} /> },
  ];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="text-destructive" size={22} />
          <h1 className="text-lg font-bold text-foreground">
            Anomalias{" "}
            <span className="text-muted-foreground font-medium text-base">(Painel de Alertas)</span>
          </h1>
        </div>

        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar anomalia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2 rounded-full border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 w-64 transition-all"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card px-3 py-2 flex items-center gap-2 shadow-sm">
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${card.bgClass}`}
            >
              {card.icon}
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider leading-none">{card.label}</p>
              <p className="text-lg font-bold" style={{ color: card.color }}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter size={14} />
          <span>Filtros:</span>
        </div>
        <select
          value={filterSeveridade}
          onChange={(e) => setFilterSeveridade(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="TODAS">Todas Severidades</option>
          <option value="CRITICA">Crítica</option>
          <option value="ALTA">Alta</option>
          <option value="MEDIA">Média</option>
          <option value="BAIXA">Baixa</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-1.5 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          <option value="TODOS">Todos Status</option>
          <option value="ABERTA">Aberta</option>
          <option value="EM_PROGRESSO">Em Progresso</option>
          <option value="RESOLVIDA">Resolvida</option>
          <option value="FECHADA">Fechada</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
            Carregando anomalias...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
              <colgroup>
                <col style={{ width: "130px" }} />
                <col style={{ width: "110px" }} />
                <col style={{ width: "90px" }} />
                <col style={{ width: "16%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "10%" }} />
                <col style={{ width: "110px" }} />
                <col />
              </colgroup>

              <thead>
                <tr>
                  <th style={{ ...thStyle, paddingLeft: "20px" }} onClick={() => toggleSort("occurred_at")}>
                    Data/Hora <SortIcon field="occurred_at" />
                  </th>
                  <th style={thStyle} onClick={() => toggleSort("tipo")}>
                    Tipo <SortIcon field="tipo" />
                  </th>
                  <th style={thStyle} onClick={() => toggleSort("severidade")}>
                    Severidade <SortIcon field="severidade" />
                  </th>
                  <th style={thStyle} onClick={() => toggleSort("grupo")}>
                    Grupo <SortIcon field="grupo" />
                  </th>
                  <th style={thStyle}>Squad</th>
                  <th style={thStyle}>Setor</th>
                  <th style={{ ...thStyle, textAlign: "center" }}>Status</th>
                  <th style={thStyle}>Descrição</th>
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                      Nenhuma anomalia encontrada.
                    </td>
                  </tr>
                ) : (
                  filtered.map((row, idx) => {
                    const { tipo, severidade, status, descricao } = extractAnomalia(row);
                    const sevStyle = SEVERITY_STYLES[severidade] ?? { bg: "#888", text: "#fff" };
                    const stsStyle = STATUS_STYLES[status] ?? { bg: "#888", text: "#fff" };
                    const isLast = idx === filtered.length - 1;
                    const borderStyle = isLast ? "none" : "1px solid hsl(var(--border))";

                    return (
                      <tr key={row.id} style={{ height: "56px" }} className="hover:bg-muted/30 transition-colors">
                        <td style={{ ...tdBase, paddingLeft: "20px", borderBottom: borderStyle }}>
                          <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", lineHeight: 1.4 }}>
                            {formatDate(row.occurred_at)}
                          </p>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            letterSpacing: "0.04em",
                            color: "hsl(var(--primary))",
                            background: "hsl(var(--primary) / 0.1)",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                          }}>
                            {TYPE_LABELS[tipo] ?? tipo}
                          </span>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: sevStyle.text,
                            background: sevStyle.bg,
                            padding: "3px 8px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                          }}>
                            {severidade}
                          </span>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <p style={{ fontSize: "13px", fontWeight: 600, color: "hsl(var(--foreground))", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {row.grupo_nome ?? "—"}
                          </p>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <span style={{ fontSize: "12px", fontWeight: 500, color: "hsl(var(--primary))", background: "hsl(var(--primary)/0.1)", padding: "2px 8px", borderRadius: "4px" }}>
                            {row.team_name ?? "—"}
                          </span>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))" }}>
                            {row.sector_name ?? "—"}
                          </p>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle, textAlign: "center" }}>
                          <span style={{
                            display: "inline-flex",
                            alignItems: "center",
                            fontSize: "11px",
                            fontWeight: 600,
                            color: stsStyle.text,
                            background: stsStyle.bg,
                            padding: "3px 10px",
                            borderRadius: "4px",
                            whiteSpace: "nowrap",
                          }}>
                            {status.replace("_", " ")}
                          </span>
                        </td>
                        <td style={{ ...tdBase, borderBottom: borderStyle }}>
                          <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            "{descricao}"
                          </p>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} de {data.length} anomalias exibidas
        </div>
      </div>
    </div>
  );
}

