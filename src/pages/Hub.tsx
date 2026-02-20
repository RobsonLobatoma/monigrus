import { useState } from "react";
import { Shield, Search, Users, AlertTriangle, TrendingUp } from "lucide-react";

type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type HubStatus   = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

interface GrupoRow {
  id: number;
  dataHora: string;
  grupo: string;
  gestor: string;
  squad: string;
  satisfacao: Satisfacao;
  score: number;
  status: HubStatus;
  descricao: string;
}

const GRUPOS: GrupoRow[] = [
  { id: 1, dataHora: "27/12/2026\n05:15", grupo: "Dr. Silva Advocacia",  gestor: "Seu Madruga", squad: "SQT1", satisfacao: "Ótimo",   score: 98, status: "RESOLVIDO", descricao: '"Cliente confirmou recebimento do parecer."' },
  { id: 2, dataHora: "27/12/2026\n05:30", grupo: "Mendes & Associados",  gestor: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 62, status: "PENDENTE",  descricao: '"Cliente pediu atualização dos honorários."' },
  { id: 3, dataHora: "27/12/2026\n05:45", grupo: "Dra. Paula Oliveira",  gestor: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 28, status: "CRÍTICO",   descricao: '"Cliente reclamou falta de posicionamento."' },
  { id: 4, dataHora: "27/12/2026\n06:08", grupo: "Advogados SP",         gestor: "Karla",       squad: "SQT2", satisfacao: "Regular", score: 58, status: "PENDENTE",  descricao: '"Cliente analisando proposta."' },
  { id: 5, dataHora: "27/12/2026\n06:15", grupo: "Santos Jurídica",      gestor: "João Lima",   squad: "SQT3", satisfacao: "Ruim",    score: 22, status: "CRÍTICO",   descricao: '"4 mensagens sem retorno."' },
];

const SAT_STYLE: Record<Satisfacao, { bg: string; text: string }> = {
  Ótimo:   { bg: "bg-green-500",  text: "text-white" },
  Regular: { bg: "bg-yellow-400", text: "text-white" },
  Ruim:    { bg: "bg-red-500",    text: "text-white" },
};

const STATUS_STYLE: Record<HubStatus, string> = {
  RESOLVIDO: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  PENDENTE:  "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-500",
  CRÍTICO:   "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
};

const scoreColor = (s: number) =>
  s >= 80 ? "bg-green-500 text-white" : s >= 50 ? "bg-yellow-400 text-white" : "bg-red-500 text-white";

const totalGrupos  = GRUPOS.length;
const criticos     = GRUPOS.filter((g) => g.status === "CRÍTICO").length;
const scoreMedia   = Math.round(GRUPOS.reduce((a, g) => a + g.score, 0) / GRUPOS.length);
const resolvidos   = GRUPOS.filter((g) => g.status === "RESOLVIDO").length;

export default function Hub() {
  const [search, setSearch] = useState("");

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
        <h1 className="text-3xl font-extrabold text-white mb-1">Olá, Dr. Ricardo!</h1>
        <p className="text-white/80 text-base mb-3">Estes são os grupos sob sua responsabilidade direta.</p>
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">
          Seu desempenho impacta diretamente o score da unidade.
        </p>
      </div>

      {/* ── Metric cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "MEUS GRUPOS",   value: totalGrupos,            sub: "grupos monitorados",    icon: <Users size={18} className="text-primary" />,         accent: "bg-primary/10" },
          { label: "CRÍTICOS",      value: criticos,               sub: "requerem atenção",      icon: <AlertTriangle size={18} className="text-red-500" />,  accent: "bg-red-500/10" },
          { label: "SCORE MÉDIO",   value: `${scoreMedia}`,        sub: "pontuação da carteira", icon: <TrendingUp size={18} className="text-green-500" />,   accent: "bg-green-500/10" },
          { label: "RESOLVIDOS",    value: resolvidos,             sub: "neste ciclo",           icon: <Shield size={18} className="text-blue-500" />,        accent: "bg-blue-500/10" },
        ].map((card) => (
          <div key={card.label} className="rounded-xl border border-border bg-card px-5 py-4 space-y-3">
            <div className={`w-9 h-9 rounded-lg ${card.accent} flex items-center justify-center`}>
              {card.icon}
            </div>
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
          {/* Table header */}
          <div className="grid grid-cols-[1fr_1.8fr_1.2fr_0.7fr_1.1fr_0.7fr_1fr_2fr] px-6 py-3 border-b border-border">
            {["DATA/HORA", "GRUPO", "GESTOR DE TRÁFEGO", "SQUAD", "SATISFAÇÃO", "SCORE", "STATUS", "DESCRIÇÃO"].map((h) => (
              <span key={h} className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{h}</span>
            ))}
          </div>

          {/* Rows */}
          {filtered.map((row) => {
            const sat   = SAT_STYLE[row.satisfacao];
            const stCls = STATUS_STYLE[row.status];
            const scCls = scoreColor(row.score);
            return (
              <div
                key={row.id}
                className="grid grid-cols-[1fr_1.8fr_1.2fr_0.7fr_1.1fr_0.7fr_1fr_2fr] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
              >
                {/* Data/Hora */}
                <p className="text-xs text-muted-foreground whitespace-pre-line leading-snug">{row.dataHora}</p>

                {/* Grupo */}
                <p className="text-sm font-semibold text-foreground">{row.grupo}</p>

                {/* Gestor */}
                <p className="text-sm text-muted-foreground">{row.gestor}</p>

                {/* Squad */}
                <p className="text-sm font-medium text-foreground">{row.squad}</p>

                {/* Satisfação */}
                <div>
                  <span className={`inline-flex items-center justify-center px-3 py-1 rounded text-sm font-bold ${sat.bg} ${sat.text} min-w-[72px]`}>
                    {row.satisfacao}
                  </span>
                </div>

                {/* Score */}
                <div>
                  <span className={`inline-flex items-center justify-center w-10 h-8 rounded text-sm font-bold ${scCls}`}>
                    {row.score}
                  </span>
                </div>

                {/* Status */}
                <div>
                  <span className={`inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md ${stCls}`}>
                    {row.status}
                  </span>
                </div>

                {/* Descrição */}
                <p className="text-xs text-muted-foreground italic truncate">{row.descricao}</p>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">Nenhum grupo encontrado.</div>
          )}
        </div>
      </div>
    </div>
  );
}
