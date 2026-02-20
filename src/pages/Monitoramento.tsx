import { useState } from "react";
import { Shield, Search } from "lucide-react";

type Satisfacao = "Ótimo" | "Regular" | "Ruim";
type StatusType = "RESOLVIDO" | "PENDENTE" | "CRÍTICO";

interface MonitoringRow {
  id: number;
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
  {
    id: 1,
    dataHora: "27/12/2026\n05:15",
    grupo: "Dr. Silva Advocacia",
    gestorTrafego: "Seu Madruga",
    squad: "SQT1",
    satisfacao: "Ótimo",
    score: 98,
    status: "RESOLVIDO",
    descricao: "Cliente confirmou recebimento do parecer.",
  },
  {
    id: 2,
    dataHora: "27/12/2026\n05:30",
    grupo: "Mendes & Associados",
    gestorTrafego: "Karla",
    squad: "SQT2",
    satisfacao: "Regular",
    score: 62,
    status: "PENDENTE",
    descricao: "Cliente pediu atualização dos honorários.",
  },
  {
    id: 3,
    dataHora: "27/12/2026\n05:45",
    grupo: "Dra. Paula Oliveira",
    gestorTrafego: "João Lima",
    squad: "SQT3",
    satisfacao: "Ruim",
    score: 28,
    status: "CRÍTICO",
    descricao: "Cliente reclamou falta de posicionamento.",
  },
  {
    id: 4,
    dataHora: "27/12/2026\n06:00",
    grupo: "Advogados SP",
    gestorTrafego: "Karla",
    squad: "SQT2",
    satisfacao: "Regular",
    score: 58,
    status: "PENDENTE",
    descricao: "Cliente analisando proposta.",
  },
  {
    id: 5,
    dataHora: "27/12/2026\n06:15",
    grupo: "Santos Jurídica",
    gestorTrafego: "João Lima",
    squad: "SQT3",
    satisfacao: "Ruim",
    score: 22,
    status: "CRÍTICO",
    descricao: "4 mensagens sem retorno.",
  },
  {
    id: 6,
    dataHora: "27/12/2026\n06:30",
    grupo: "Lima & Ferreira",
    gestorTrafego: "Ana Costa",
    squad: "SQT1",
    satisfacao: "Ótimo",
    score: 91,
    status: "RESOLVIDO",
    descricao: "Acordo firmado com sucesso.",
  },
  {
    id: 7,
    dataHora: "27/12/2026\n06:45",
    grupo: "Carvalho Consultoria",
    gestorTrafego: "Seu Madruga",
    squad: "SQT2",
    satisfacao: "Regular",
    score: 55,
    status: "PENDENTE",
    descricao: "Aguardando documentação complementar.",
  },
];

const satisfacaoConfig: Record<Satisfacao, { bg: string; text: string }> = {
  Ótimo: {
    bg: "bg-[hsl(var(--status-otimo))]",
    text: "text-white",
  },
  Regular: {
    bg: "bg-[hsl(var(--status-regular))]",
    text: "text-white",
  },
  Ruim: {
    bg: "bg-[hsl(var(--status-ruim))]",
    text: "text-white",
  },
};

const statusConfig: Record<StatusType, { color: string; bg: string }> = {
  RESOLVIDO: {
    color: "text-[hsl(var(--status-otimo))]",
    bg: "bg-[hsl(var(--status-otimo)/0.12)]",
  },
  PENDENTE: {
    color: "text-[hsl(var(--status-regular))]",
    bg: "bg-[hsl(var(--status-regular)/0.12)]",
  },
  CRÍTICO: {
    color: "text-[hsl(var(--status-ruim))]",
    bg: "bg-[hsl(var(--status-ruim)/0.12)]",
  },
};

export default function Monitoramento() {
  const [search, setSearch] = useState("");

  const filtered = mockData.filter(
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

        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
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
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Data/Hora
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Grupo
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Gestor de Tráfego
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Squad
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Satisfação
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Score
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Descrição
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-muted-foreground">
                    Nenhum resultado encontrado.
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const satConfig = satisfacaoConfig[row.satisfacao];
                  const stConfig = statusConfig[row.status];
                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-border transition-colors hover:bg-muted/30 ${
                        idx % 2 === 0 ? "" : "bg-muted/10"
                      }`}
                    >
                      {/* Data/Hora */}
                      <td className="px-4 py-3 text-muted-foreground whitespace-pre-line leading-snug text-xs">
                        {row.dataHora}
                      </td>

                      {/* Grupo */}
                      <td className="px-4 py-3 font-semibold text-foreground">
                        {row.grupo}
                      </td>

                      {/* Gestor */}
                      <td className="px-4 py-3 text-muted-foreground">{row.gestorTrafego}</td>

                      {/* Squad */}
                      <td className="px-4 py-3">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">
                          {row.squad}
                        </span>
                      </td>

                      {/* Satisfação + Score (merged visual) */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-4 py-1 rounded font-semibold text-sm ${satConfig.bg} ${satConfig.text}`}
                        >
                          {row.satisfacao}
                        </span>
                      </td>

                      {/* Score */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center justify-center w-10 h-8 rounded font-bold text-sm ${satConfig.bg} ${satConfig.text}`}
                        >
                          {row.score}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wide ${stConfig.bg} ${stConfig.color}`}
                        >
                          {row.status}
                        </span>
                      </td>

                      {/* Descrição */}
                      <td className="px-4 py-3 text-muted-foreground italic max-w-xs">
                        "{row.descricao}"
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer count */}
        <div className="px-4 py-3 border-t border-border bg-muted/20 text-xs text-muted-foreground">
          {filtered.length} de {mockData.length} registros exibidos
        </div>
      </div>
    </div>
  );
}
