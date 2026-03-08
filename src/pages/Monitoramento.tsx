import { useState, useMemo } from "react";
import { Shield, Search, CalendarIcon, X, Filter } from "lucide-react";
import { subDays, format } from "date-fns";
import { DateRange } from "react-day-picker";
import { useGrupos } from "@/hooks/useGrupos";
import { useGroupConversations } from "@/hooks/useGroupConversations";
import { useTeams } from "@/hooks/useTeams";
import { useCurrentUserRole } from "@/hooks/useCurrentUserRole";
import { useMonitoringSettings } from "@/hooks/useMonitoringSettings";

import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Satisfacao = string;
type StatusType = string;

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

const FALLBACK_SAT_STYLE: Record<string, { background: string; color: string }> = {
  "Ótimo":   { background: "#22c55e", color: "#ffffff" },
  "Regular": { background: "#facc15", color: "#000000" },
  "Ruim":    { background: "#ef4444", color: "#ffffff" },
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

function parseDateString(dateStr: string): Date | null {
  if (!dateStr || dateStr === "—") return null;
  const clean = dateStr.replace("\n", " ").trim();
  const match = clean.match(/^(\d{2})\/(\d{2})\/(\d{4})\s*(\d{2}):(\d{2})$/);
  if (match) {
    return new Date(+match[3], +match[2] - 1, +match[1], +match[4], +match[5]);
  }
  const d = new Date(clean);
  return isNaN(d.getTime()) ? null : d;
}

export default function Monitoramento() {
  const { data: dbGrupos } = useGrupos();
  useGroupConversations();
  const { data: teams } = useTeams();
  const { role, loading: roleLoading } = useCurrentUserRole();
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "7d" | "14d" | "30d" | "custom">("all");
  const [customDateRange, setCustomDateRange] = useState<DateRange | undefined>();
  const [filterGestor, setFilterGestor] = useState("all");

  const { data: satSettings = [] } = useMonitoringSettings("SATISFACAO");
  const { data: scoreSettings = [] } = useMonitoringSettings("SCORE");
  const { data: statusSettings = [] } = useMonitoringSettings("STATUS");
  const { data: keywordSettings = [] } = useMonitoringSettings("PALAVRA_CHAVE");

  const satStyleMap = useMemo(() => {
    const map: Record<string, { background: string; color: string }> = { ...FALLBACK_SAT_STYLE };
    satSettings.forEach((s) => {
      if (s.color) {
        map[s.label] = { background: s.color, color: isLightColor(s.color) ? "#000000" : "#ffffff" };
      }
    });
    return map;
  }, [satSettings]);

  const statusStyleMap = useMemo(() => {
    const map: Record<string, { background: string; color: string }> = {};
    statusSettings.forEach((s) => {
      if (s.color) {
        map[s.label] = { background: s.color, color: isLightColor(s.color) ? "#000000" : "#ffffff" };
      }
    });
    return map;
  }, [statusSettings]);

  const scoreToSatisfacao = useMemo(() => {
    if (scoreSettings.length === 0) {
      return (score: number): string => {
        if (score >= 71) return "Ótimo";
        if (score >= 41) return "Regular";
        return "Ruim";
      };
    }
    return (score: number): string => {
      for (const s of scoreSettings) {
        if (s.min_value !== null && s.max_value !== null && score >= s.min_value && score <= s.max_value) {
          return s.label;
        }
      }
      return "Regular";
    };
  }, [scoreSettings]);

  const activeKeywords = useMemo(
    () => keywordSettings.filter((k) => k.is_active).map((k) => k.label.toLowerCase()),
    [keywordSettings]
  );

  const teamMap = useMemo(() => {
    const m: Record<string, string> = {};
    teams?.forEach(t => { m[t.id] = t.name; });
    return m;
  }, [teams]);

  const hasRealData = dbGrupos && dbGrupos.length > 0;


  const data = useMemo((): MonitoringRow[] => {
    if (hasRealData) {
      return dbGrupos.map((g) => {
        const score = g.mensagens > 0 ? Math.min(100, Math.round(g.mensagens / 3)) : 50;
        return {
          id: g.id,
          dataHora: (g as any).last_message_at
            ? format(new Date((g as any).last_message_at), "dd/MM/yyyy\nHH:mm")
            : g.ultima_atividade ?? "—",
          grupo: g.nome,
          gestorTrafego: g.gestor ?? "—",
          squad: g.team_id ? teamMap[g.team_id] ?? "—" : "—",
          satisfacao: scoreToSatisfacao(score),
          score,
          status: g.status ?? "PENDENTE",
          descricao: (g as any).last_message || "Sem mensagens",
          tagId: g.tag_id ?? null,
        };
      });
    }
    return [];
  }, [dbGrupos, hasRealData, scoreToSatisfacao, teamMap]);

  const dateRange = useMemo(() => {
    const now = new Date();
    switch (filterPeriod) {
      case "7d": return { from: subDays(now, 7), to: now };
      case "14d": return { from: subDays(now, 14), to: now };
      case "30d": return { from: subDays(now, 30), to: now };
      case "custom": return customDateRange ? { from: customDateRange.from, to: customDateRange.to } : { from: undefined, to: undefined };
      default: return { from: undefined, to: undefined };
    }
  }, [filterPeriod, customDateRange]);

  const gestoresList = useMemo(() => {
    const set = new Set(data.map((r) => r.gestorTrafego).filter((g) => g !== "—"));
    return Array.from(set).sort();
  }, [data]);

  const hasActiveFilters = filterPeriod !== "all" || filterGestor !== "all" || search !== "";
  const clearAllFilters = () => {
    setFilterPeriod("all");
    setCustomDateRange(undefined);
    setFilterGestor("all");
    setSearch("");
  };

  const filtered = useMemo(() => {
    return data.filter((row) => {
      const matchSearch = search === "" ||
        row.grupo.toLowerCase().includes(search.toLowerCase()) ||
        row.gestorTrafego.toLowerCase().includes(search.toLowerCase()) ||
        row.squad.toLowerCase().includes(search.toLowerCase()) ||
        row.status.toLowerCase().includes(search.toLowerCase());
      const matchGestor = filterGestor === "all" || row.gestorTrafego === filterGestor;
      let matchDate = true;
      if (dateRange.from) {
        const d = parseDateString(row.dataHora);
        if (!d) { matchDate = false; }
        else { matchDate = d >= dateRange.from && d <= (dateRange.to ?? new Date()); }
      }
      return matchSearch && matchGestor && matchDate;
    });
  }, [data, search, filterGestor, dateRange]);

  if (!roleLoading && role === "OPERACIONAL") {
    return <Navigate to="/" replace />;
  }

  function renderDescricao(text: string) {
    if (activeKeywords.length === 0) return `"${text}"`;
    const regex = new RegExp(`(${activeKeywords.map(escapeRegex).join("|")})`, "gi");
    const parts = text.split(regex);
    return (
      <>
        "
        {parts.map((part, i) =>
          activeKeywords.includes(part.toLowerCase()) ? (
            <span key={i} className="font-bold text-primary">{part}</span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
        "
      </>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="text-primary" size={26} />
        <h1 className="text-2xl font-bold text-foreground">
          Painel de Monitoramento{" "}
          <span className="text-muted-foreground font-medium text-xl">(GLOBAL)</span>
        </h1>
      </div>

      {/* ── Barra de filtros global ── */}
      <div className="flex items-center flex-wrap gap-2 bg-muted/30 rounded-lg p-3 border">
        <Filter size={14} className="text-muted-foreground" />
        {(["7d", "14d", "30d"] as const).map((p) => (
          <Button
            key={p}
            size="sm"
            variant={filterPeriod === p ? "default" : "outline"}
            className="h-8 text-xs"
            onClick={() => setFilterPeriod(filterPeriod === p ? "all" : p)}
          >
            {p === "7d" ? "7 dias" : p === "14d" ? "14 dias" : "30 dias"}
          </Button>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              size="sm"
              variant={filterPeriod === "custom" ? "default" : "outline"}
              className="h-8 text-xs gap-1"
            >
              <CalendarIcon size={12} />
              {filterPeriod === "custom" && customDateRange?.from
                ? `${format(customDateRange.from, "dd/MM")}${customDateRange.to ? ` - ${format(customDateRange.to, "dd/MM")}` : ""}`
                : "Personalizado"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={customDateRange}
              onSelect={(range) => {
                setCustomDateRange(range);
                setFilterPeriod("custom");
              }}
              numberOfMonths={2}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <div className="w-px h-6 bg-border" />

        <Select value={filterGestor} onValueChange={setFilterGestor}>
          <SelectTrigger className="h-8 w-[180px] text-xs">
            <SelectValue placeholder="Gestor de tráfego" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os gestores</SelectItem>
            {gestoresList.map((g) => (
              <SelectItem key={g} value={g}>{g}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="w-px h-6 bg-border" />

        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar grupo..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-1.5 rounded-full border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 w-48"
          />
        </div>

        {hasActiveFilters && (
          <Button size="sm" variant="ghost" className="h-8 text-xs gap-1 text-muted-foreground" onClick={clearAllFilters}>
            <X size={12} /> Limpar
          </Button>
        )}
      </div>

      {/* Table card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "fixed" }}>
          <colgroup>
            <col style={{ width: "90px" }} />
            <col style={{ width: "16%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "60px" }} />
            <col style={{ width: "110px" }} />
            <col style={{ width: "100px" }} />
            <col style={{ width: "80px" }} />
            <col style={{ width: "100px" }} />
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
              <th style={thStyle}>TAG</th>
              <th style={thStyle}>CONVERSAS</th>
            </tr>
          </thead>

          <tbody>
            {!hasRealData ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "16px", fontWeight: 600 }}>Nenhum grupo sincronizado</span>
                    <span>Vá para a página de <a href="/conexoes" style={{ color: "hsl(var(--primary))", textDecoration: "underline" }}>Conexões</a> para conectar uma instância e sincronizar grupos do WhatsApp.</span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", padding: "48px", color: "hsl(var(--muted-foreground))", fontSize: "14px" }}>
                  Nenhum resultado encontrado.
                </td>
              </tr>
            ) : (
              filtered.map((row, idx) => {
                const satStyle = satStyleMap[row.satisfacao] ?? { background: "#888", color: "#fff" };
                const stsStyle = statusStyleMap[row.status];
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
                      {stsStyle ? (
                        <span style={{
                          display: "inline-flex",
                          alignItems: "center",
                          fontSize: "11px",
                          fontWeight: 600,
                          letterSpacing: "0.04em",
                          color: stsStyle.color,
                          background: stsStyle.background,
                          padding: "2px 8px",
                          borderRadius: "4px",
                          whiteSpace: "nowrap",
                        }}>
                          {row.status}
                        </span>
                      ) : (
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
                      )}
                    </td>
                    <td style={{ ...tdBase, borderBottom: borderStyle }}>
                      <Select
                        value={row.tagId || "none"}
                        onValueChange={(val) => {
                          updateGrupo.mutate({ id: row.id, tag_id: val === "none" ? null : val });
                        }}
                      >
                        <SelectTrigger className="h-7 text-xs w-[110px]">
                          <SelectValue placeholder="Tag" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma</SelectItem>
                          {tags?.map(tag => (
                            <SelectItem key={tag.id} value={tag.id}>
                              <span className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: tag.cor }} />
                                {tag.nome}
                              </span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td style={{ ...tdBase, borderBottom: borderStyle }}>
                      <p style={{ fontSize: "12px", color: "hsl(var(--muted-foreground))", fontStyle: "italic", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {renderDescricao(row.descricao)}
                      </p>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} de {data.length} registros exibidos
        </div>
      </div>
    </div>
  );
}

function isLightColor(hex: string): boolean {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
