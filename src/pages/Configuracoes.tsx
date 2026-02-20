import { useState } from "react";
import {
  Settings, Globe, Users, LayoutGrid, Hash, Shield, Save, History,
  Search, UserPlus, Pencil, Trash2, X, Target, Plus, MoreVertical,
  Clock, MessageSquare, Filter, Save as SaveIcon, AlertTriangle,
  Monitor, Link2, CheckCircle2, Circle, Loader2,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useTeams, useCreateTeam, useUpdateTeam, useDeleteTeam } from "@/hooks/useTeams";
import type { Team } from "@/hooks/useTeams";
import { useGrupos, useCreateGrupo, useUpdateGrupo, useDeleteGrupo } from "@/hooks/useGrupos";
import type { Grupo } from "@/hooks/useGrupos";
import { useUserProfiles, useUpdateUserProfile, useDeleteUserProfile } from "@/hooks/useUserProfiles";

/* ─── Usuários & Cargos ─── */
const CARGO_COLORS: Record<string, string> = {
  DIRETOR: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  GERENTE: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  SUPERVISOR: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  "GESTOR DE TRÁFEGO": "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
  OPERACIONAL: "text-gray-600 bg-gray-100 dark:bg-gray-900/30 dark:text-gray-400",
};
const CARGOS = ["DIRETOR", "GERENTE", "SUPERVISOR", "OPERACIONAL"];
const SUPERVISOR_OPTIONS = ["Carlos Eduardo", "Karla Mendes", "João Lima", "Ana Maria"];
const GESTORES_OPTIONS   = ["Seu Madruga", "Patrícia", "Karla", "Roberto", "João Lima", "André"];

/* ─── Grupos ─── */
type GrupoSLA    = "DENTRO DO SLA" | "FORA DO SLA";
const SLA_STYLE: Record<GrupoSLA, string>    = { "DENTRO DO SLA": "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400", "FORA DO SLA": "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" };
const STATUS_STYLE: Record<string, string> = { RESOLVIDO: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400", PENDENTE: "text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400", CRÍTICO: "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400" };

/* ─── Hierarquia & Permissões ─── */
type Cargo = "DIRETOR" | "GERENTE" | "SUPERVISOR" | "GESTOR DE TRÁFEGO";

const HIERARCHY = [
  { initial: "D", label: "DIRETOR",           desc: "Visão Estratégica & Gestão Global",   avatarClass: "bg-purple-500" },
  { initial: "G", label: "GERENTE",           desc: "Operações & Táticas Regionais",        avatarClass: "bg-blue-500"   },
  { initial: "S", label: "SUPERVISOR",        desc: "Gestão de Squads & SLAs",              avatarClass: "bg-teal-500"   },
  { initial: "G", label: "GESTOR DE TRÁFEGO", desc: "Operação Direta em Grupos",            avatarClass: "bg-green-500"  },
];

const SIMULATOR_CARGOS: Cargo[] = ["DIRETOR", "GERENTE", "SUPERVISOR", "GESTOR DE TRÁFEGO"];

const ACCESS_MATRIX: { label: string; icon: JSX.Element; perms: [boolean, boolean, boolean, boolean] }[] = [
  { label: "Monitoramento",    icon: <Monitor size={15} className="text-muted-foreground" />,  perms: [true,  true,  true,  false] },
  { label: "Hub do Colaborador", icon: <Users size={15} className="text-muted-foreground" />,  perms: [true,  false, true,  true]  },
  { label: "Anomalias",        icon: <AlertTriangle size={15} className="text-muted-foreground" />, perms: [true,  true,  false, false] },
  { label: "Conexões",         icon: <Link2 size={15} className="text-muted-foreground" />,   perms: [true,  true,  false, false] },
  { label: "Configurações",    icon: <Settings size={15} className="text-muted-foreground" />, perms: [true,  true,  true,  true]  },
];

const AVATAR_COLORS: Record<string, string> = {
  C: "bg-green-500", K: "bg-blue-500", J: "bg-orange-500",
  A: "bg-purple-500", D: "bg-red-500", S: "bg-teal-500",
};

function SkeletonRow() {
  return (
    <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center px-6 py-4 border-b border-border">
      {[1,2,3,4,5].map((i) => <div key={i} className="h-4 bg-muted animate-pulse rounded w-3/4" />)}
    </div>
  );
}

export default function Configuracoes() {
  /* ── Supabase hooks ── */
  const { data: userProfiles = [], isLoading: loadingUsers } = useUserProfiles();
  const { data: teamsData = [], isLoading: loadingTeams } = useTeams();
  const { data: gruposData = [], isLoading: loadingGrupos } = useGrupos();

  const updateUser = useUpdateUserProfile();
  const deleteUser = useDeleteUserProfile();
  const createTeam = useCreateTeam();
  const updateTeam = useUpdateTeam();
  const deleteTeam = useDeleteTeam();
  const createGrupo = useCreateGrupo();
  const updateGrupo = useUpdateGrupo();
  const deleteGrupo = useDeleteGrupo();

  /* ── Usuários ── */
  const [search, setSearch] = useState("");
  const [userModal, setUserModal] = useState(false);
  const [newName, setNewName]     = useState("");
  const [newCargo, setNewCargo]   = useState("DIRETOR");

  /* Edição de Usuário */
  const [editModal, setEditModal] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [editName, setEditName]   = useState("");
  const [editCargo, setEditCargo] = useState("DIRETOR");

  const openEditModal = (u: typeof userProfiles[number]) => {
    setEditUserId(u.user_id);
    setEditName(u.full_name);
    setEditCargo(u.role ?? "OPERACIONAL");
    setEditModal(true);
  };
  const handleSaveEdit = () => {
    if (!editUserId || !editName.trim()) return;
    updateUser.mutate({ user_id: editUserId, full_name: editName.trim() }, {
      onSuccess: () => { setEditModal(false); setEditUserId(null); },
    });
  };

  /* ── Squads ── */
  const [squadModal, setSquadModal]             = useState(false);
  const [newSquadName, setNewSquadName]         = useState("");
  const [newSupervisor, setNewSupervisor]       = useState("Carlos Eduardo");
  const [editSquadModal, setEditSquadModal]     = useState(false);
  const [editSquadId, setEditSquadId]           = useState<string | null>(null);
  const [editSquadName, setEditSquadName]       = useState("");
  const [editSquadSup, setEditSquadSup]         = useState("Carlos Eduardo");
  const [editSquadGestores, setEditSquadGestores] = useState<string[]>([]);

  const openEditSquadModal = (squad: Team) => {
    setEditSquadId(squad.id);
    setEditSquadName(squad.name);
    setEditSquadSup(squad.supervisor ?? "Carlos Eduardo");
    setEditSquadGestores([...(squad.gestores ?? [])]);
    setEditSquadModal(true);
  };
  const toggleGestor = (g: string) => {
    setEditSquadGestores((prev) =>
      prev.includes(g.toUpperCase()) ? prev.filter((x) => x !== g.toUpperCase()) : [...prev, g.toUpperCase()]
    );
  };
  const handleSaveSquad = () => {
    if (!editSquadId || !editSquadName.trim()) return;
    updateTeam.mutate({ id: editSquadId, name: editSquadName.trim().toUpperCase(), supervisor: editSquadSup, gestores: editSquadGestores }, {
      onSuccess: () => { setEditSquadModal(false); setEditSquadId(null); },
    });
  };
  const handleAtivarSquad = () => {
    if (!newSquadName.trim()) return;
    createTeam.mutate({ name: newSquadName.trim().toUpperCase(), supervisor: newSupervisor, gestores: [] }, {
      onSuccess: () => { setNewSquadName(""); setNewSupervisor("Carlos Eduardo"); setSquadModal(false); },
    });
  };

  /* ── Grupos ── */
  const [grupoSearch, setGrupoSearch]     = useState("");
  const [slaFilter, setSlaFilter]         = useState<"todos" | GrupoSLA>("todos");
  const [grupoModal, setGrupoModal]       = useState(false);
  const [slaTime, setSlaTime]             = useState("09:30");
  const [newGrupoNome, setNewGrupoNome]   = useState("");
  const [newGrupoGestor, setNewGrupoGestor] = useState("Seu Madruga");

  const [editGrupoModal, setEditGrupoModal] = useState(false);
  const [editGrupoId, setEditGrupoId]       = useState<string | null>(null);
  const [editGrupoNome, setEditGrupoNome]   = useState("");
  const [editGrupoGestor, setEditGrupoGestor] = useState("Seu Madruga");
  const [editGrupoSla, setEditGrupoSla]     = useState<GrupoSLA>("DENTRO DO SLA");

  const openEditGrupoModal = (g: Grupo) => {
    setEditGrupoId(g.id);
    setEditGrupoNome(g.nome);
    setEditGrupoGestor(g.gestor ?? "Seu Madruga");
    setEditGrupoSla((g.sla as GrupoSLA) ?? "DENTRO DO SLA");
    setEditGrupoModal(true);
  };
  const handleSaveGrupo = () => {
    if (!editGrupoId || !editGrupoNome.trim()) return;
    updateGrupo.mutate({ id: editGrupoId, nome: editGrupoNome.trim(), gestor: editGrupoGestor, sla: editGrupoSla }, {
      onSuccess: () => { setEditGrupoModal(false); setEditGrupoId(null); },
    });
  };
  const handleIniciarMonitoramento = () => {
    if (!newGrupoNome.trim()) return;
    createGrupo.mutate({ nome: newGrupoNome.trim(), gestor: newGrupoGestor, sla: "DENTRO DO SLA", status: "PENDENTE" }, {
      onSuccess: () => { setNewGrupoNome(""); setNewGrupoGestor("Seu Madruga"); setGrupoModal(false); },
    });
  };

  /* ── Hierarquia & Permissões ── */
  const [simCargo, setSimCargo] = useState<Cargo>("DIRETOR");
  const cargoIndex: Record<Cargo, number> = { "DIRETOR": 0, "GERENTE": 1, "SUPERVISOR": 2, "GESTOR DE TRÁFEGO": 3 };

  /* ── Filtros ── */
  const filteredUsers = userProfiles.filter(
    (u) => u.full_name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );
  const filteredGrupos = gruposData.filter((g) => {
    const matchSearch = g.nome.toLowerCase().includes(grupoSearch.toLowerCase());
    const matchSla    = slaFilter === "todos" || g.sla === slaFilter;
    return matchSearch && matchSla;
  });

  const noAuthWarning = (
    <div className="flex items-center gap-2 px-4 py-3 mb-4 rounded-lg border border-yellow-400/40 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 text-xs font-medium">
      <AlertTriangle size={14} />
      <span>Sem usuário autenticado — os dados do Supabase ficam vazios. Implemente o login para persistir e visualizar registros.</span>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Hierarquia e Acessos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Administração de usuários, cargos, squads e permissões RBAC.</p>
          </div>
        </div>
        <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5">
          <Save size={16} /> Salvar Tudo
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0">
          {[
            { value: "visao-geral",          icon: <Globe size={15} />,      label: "Visão Geral" },
            { value: "usuarios-cargos",       icon: <Users size={15} />,      label: "Usuários & Cargos" },
            { value: "gestao-squads",         icon: <LayoutGrid size={15} />, label: "Gestão de Squads" },
            { value: "gestao-grupos",         icon: <Hash size={15} />,       label: "Gestão de Grupos" },
            { value: "hierarquia-permissoes", icon: <Shield size={15} />,     label: "Hierarquia & Permissões" },
          ].map((tab) => (
            <TabsTrigger key={tab.value} value={tab.value}
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">
              {tab.icon}{tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════ Visão Geral ════ */}
        <TabsContent value="visao-geral" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 text-white" style={{ background: "linear-gradient(135deg, #3b5bdb 0%, #6741d9 100%)" }}>
              <div className="flex items-center gap-3 mb-4"><Globe size={22} className="text-white" /><h2 className="text-xl font-bold">Sistema de Acesso Inteligente</h2></div>
              <p className="text-sm text-white/85 leading-relaxed mb-6">Esta área controla a visibilidade de usuários, grupos e acessos operacionais. As permissões são baseadas em cargos (RBAC) e o sistema se adapta ao seu nível hierárquico.</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-white/10 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">{loadingUsers ? "…" : userProfiles.length}</p>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">Usuários</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">{loadingTeams ? "…" : teamsData.length}</p>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">Squads</p>
                </div>
                <div className="rounded-lg bg-white/10 px-3 py-2 text-center">
                  <p className="text-xl font-bold text-white">{loadingGrupos ? "…" : gruposData.length}</p>
                  <p className="text-[10px] text-white/70 uppercase tracking-wide">Grupos</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center"><Shield size={26} className="text-primary" /></div>
              <h2 className="text-base font-semibold text-foreground">Matriz de Auditoria</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">Todas as mudanças de cargos e squads são registradas para auditoria de segurança.</p>
              <button className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium mt-1"><History size={14} />Ver Histórico de Auditoria</button>
            </div>
          </div>
        </TabsContent>

        {/* ════ Usuários & Cargos ════ */}
        <TabsContent value="usuarios-cargos" className="mt-6">
          {!loadingUsers && userProfiles.length === 0 && noAuthWarning}
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Filtrar usuário..." value={search} onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button onClick={() => setUserModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity">
              <UserPlus size={16} />Novo Usuário
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] px-6 py-3 border-b border-border">
              {["COLABORADOR","CARGO","SQUAD","STATUS","AÇÕES"].map((h) => (
                <span key={h} className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</span>
              ))}
            </div>
            {loadingUsers ? (
              <>{[1,2,3].map((i) => <SkeletonRow key={i} />)}</>
            ) : filteredUsers.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
            ) : filteredUsers.map((user) => {
              const initial = user.full_name.charAt(0).toUpperCase();
              const role = user.role?.toUpperCase() ?? "OPERACIONAL";
              const cargoClass = CARGO_COLORS[role] ?? "text-muted-foreground bg-muted";
              return (
                <div key={user.user_id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0"><span className="text-sm font-bold text-primary">{initial}</span></div>
                    <div><p className="text-sm font-semibold text-foreground">{user.full_name}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                  </div>
                  <div><span className={`inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md ${cargoClass}`}>{role}</span></div>
                  <span className="text-sm font-medium text-foreground">—</span>
                  <div className="flex items-center"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" /></div>
                  <div className="flex items-center gap-3">
                    <button onClick={() => openEditModal(user)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => deleteUser.mutate(user.user_id)} className="text-muted-foreground hover:text-destructive"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ════ Gestão de Squads ════ */}
        <TabsContent value="gestao-squads" className="mt-6">
          {!loadingTeams && teamsData.length === 0 && noAuthWarning}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Estrutura Operacional</h2>
            <button onClick={() => setSquadModal(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus size={16} />Novo Squad
            </button>
          </div>
          {loadingTeams ? (
            <div className="flex items-center justify-center py-16 gap-2 text-muted-foreground">
              <Loader2 size={18} className="animate-spin" /><span className="text-sm">Carregando squads...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {teamsData.map((squad) => {
                const initial = (squad.supervisor ?? squad.name).charAt(0).toUpperCase();
                const avatarBg = AVATAR_COLORS[initial] ?? "bg-primary";
                return (
                  <div key={squad.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center"><Target size={22} className="text-primary" /></div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditSquadModal(squad)} className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => deleteTeam.mutate(squad.id)} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    <p className="text-xl font-bold text-foreground">{squad.name}</p>
                    <div className="rounded-lg border border-dashed border-border p-3">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Supervisor Resp.</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-7 h-7 rounded-full ${avatarBg} flex items-center justify-center`}><span className="text-xs font-bold text-white">{initial}</span></div>
                        <span className="text-sm font-semibold text-foreground">{squad.supervisor ?? "—"}</span>
                      </div>
                    </div>
                    {(squad.gestores ?? []).length > 0 && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">Gestores Vinculados ({squad.gestores.length})</p>
                        <div className="flex flex-wrap gap-2">
                          {squad.gestores.map((g) => <span key={g} className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border text-muted-foreground bg-muted/40 uppercase tracking-wide">{g}</span>)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* ════ Gestão de Grupos ════ */}
        <TabsContent value="gestao-grupos" className="mt-6 space-y-5">
          {!loadingGrupos && gruposData.length === 0 && noAuthWarning}
          <div className="flex items-center gap-4 rounded-xl border border-border bg-card px-5 py-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0"><Clock size={20} className="text-primary" /></div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">CONFIGURAÇÃO DE SLA</p>
              <p className="text-xs text-muted-foreground mt-0.5">Este horário define o limite de resposta para os grupos.</p>
            </div>
            <div className="flex items-center gap-2 ml-auto">
              <div className="text-right">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1">Horário Limite de Resposta</p>
                <div className="flex items-center gap-2">
                  <input type="time" value={slaTime} onChange={(e) => setSlaTime(e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
                  <button className="w-8 h-8 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground hover:text-primary transition-colors"><SaveIcon size={14} /></button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input type="text" placeholder="Buscar por nome do grupo..." value={grupoSearch} onChange={(e) => setGrupoSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
            </div>
            <button onClick={() => setSlaFilter(slaFilter === "todos" ? "FORA DO SLA" : "todos")}
              className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium transition-colors ${slaFilter !== "todos" ? "border-primary bg-primary/10 text-primary" : "border-border bg-background text-muted-foreground hover:text-foreground"}`}>
              <Filter size={14} />{slaFilter === "todos" ? "Todos os SLAs" : "Fora do SLA"}
            </button>
            <button onClick={() => setGrupoModal(true)} className="ml-auto flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
              <Plus size={16} />Criar Grupo
            </button>
          </div>
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_1fr_1.4fr_90px] px-6 py-3 border-b border-border">
              {["NOME DO GRUPO","SQUAD / GESTOR","SLA","STATUS","MENSAGENS","ÚLTIMA ATIVIDADE","AÇÕES"].map((h) => (
                <span key={h} className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</span>
              ))}
            </div>
            {loadingGrupos ? (
              <div className="flex items-center justify-center py-12 gap-2 text-muted-foreground">
                <Loader2 size={18} className="animate-spin" /><span className="text-sm">Carregando grupos...</span>
              </div>
            ) : filteredGrupos.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum grupo encontrado.</div>
            ) : filteredGrupos.map((g) => (
              <div key={g.id} className="grid grid-cols-[2fr_1.5fr_1.2fr_1.2fr_1fr_1.4fr_90px] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                <div><p className="text-sm font-semibold text-foreground">{g.nome}</p><p className="text-xs text-muted-foreground">{g.id.slice(0, 8)}…</p></div>
                <div><p className="text-sm font-semibold text-foreground">—</p><p className="text-xs text-muted-foreground">{g.gestor ?? "—"}</p></div>
                <div><span className={`inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md ${SLA_STYLE[g.sla as GrupoSLA] ?? "text-muted-foreground bg-muted"}`}>{g.sla}</span></div>
                <div><span className={`inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md ${STATUS_STYLE[g.status?.toUpperCase()] ?? "text-muted-foreground bg-muted"}`}>{g.status}</span></div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground"><MessageSquare size={14} /><span className="font-semibold text-foreground">{g.mensagens}</span></div>
                <p className="text-xs text-muted-foreground">{g.ultima_atividade ?? "—"}</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => openEditGrupoModal(g)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil size={15} /></button>
                  <button onClick={() => deleteGrupo.mutate(g.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* ════ Hierarquia & Permissões ════ */}
        <TabsContent value="hierarquia-permissoes" className="mt-6 space-y-8">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground text-center mb-5">
              Fluxo Hierárquico do Sistema
            </p>
            <div className="flex flex-col items-center gap-0">
              {HIERARCHY.map((h, i) => (
                <div key={h.label} className="flex flex-col items-center w-full max-w-md">
                  <div className="w-full rounded-xl border border-border bg-card px-5 py-3.5 flex items-center gap-4">
                    <div className={`w-9 h-9 rounded-lg ${h.avatarClass} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-sm font-bold text-white">{h.initial}</span>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-foreground">{h.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{h.desc}</p>
                    </div>
                  </div>
                  {i < HIERARCHY.length - 1 && (
                    <div className="flex flex-col items-center py-1">
                      <div className="w-px h-3 bg-border" />
                      <Plus size={12} className="text-muted-foreground" />
                      <div className="w-px h-3 bg-border" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl p-6 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)" }}>
            <div className="absolute right-6 top-1/2 -translate-y-1/2 opacity-10"><Shield size={120} className="text-white" /></div>
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-3"><Shield size={18} className="text-primary" /><h3 className="text-base font-bold uppercase tracking-wide text-white">Simulador de Cargo</h3></div>
              <p className="text-sm text-slate-300 mb-5 max-w-lg leading-relaxed">
                <span className="text-yellow-400 font-bold">⚠ MODO SIMULAÇÃO:</span>{" "}
                Selecione o cargo abaixo para alternar IMEDIATAMENTE a visibilidade de abas e listas de grupos em toda esta página.
              </p>
              <div className="flex flex-wrap gap-2">
                {SIMULATOR_CARGOS.map((c) => (
                  <button key={c} onClick={() => setSimCargo(c)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all ${simCargo === c ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30" : "bg-white/10 text-slate-300 hover:bg-white/20"}`}>
                    {c}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Matriz de Acessos</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Defina quais módulos cada cargo pode acessar por padrão.</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-red-500 uppercase tracking-wide">
                <AlertTriangle size={13} />Somente diretores podem editar a matriz
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] px-6 py-3 border-b border-border">
                {["MÓDULO", "DIRETOR", "GERENTE", "SUPERVISOR", "GESTOR DE TRÁFEGO"].map((h) => (
                  <span key={h} className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</span>
                ))}
              </div>
              {ACCESS_MATRIX.map((row) => (
                <div key={row.label} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2.5">{row.icon}<span className="text-sm font-medium text-foreground">{row.label}</span></div>
                  {row.perms.map((allowed, ci) => {
                    const isSimActive = cargoIndex[simCargo] === ci;
                    return (
                      <div key={ci} className={`flex items-center transition-all ${isSimActive ? "scale-110" : ""}`}>
                        {allowed ? <CheckCircle2 size={22} className="text-green-500" /> : <Circle size={22} className="text-muted-foreground/30" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ══ Modal: Criar Usuário ══ */}
      {userModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Criar Novo Usuário</h2>
              <button onClick={() => setUserModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="rounded-lg border border-yellow-400/40 bg-yellow-400/10 text-yellow-700 dark:text-yellow-400 text-xs px-3 py-2">
                Usuários são criados via autenticação Supabase. Use o painel Supabase para convidar usuários.
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cargo</label>
                <select value={newCargo} onChange={(e) => setNewCargo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {CARGOS.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={() => setUserModal(false)} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">Fechar</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Editar Usuário ══ */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Editar Colaborador</h2>
              <button onClick={() => setEditModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Nome</label>
                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSaveEdit} disabled={updateUser.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {updateUser.isPending && <Loader2 size={14} className="animate-spin" />}Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Editar Squad ══ */}
      {editSquadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Editar Squad</h2>
              <button onClick={() => setEditSquadModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Nome do Squad</label>
                <input type="text" value={editSquadName} onChange={(e) => setEditSquadName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Supervisor Responsável</label>
                <select value={editSquadSup} onChange={(e) => setEditSquadSup(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {SUPERVISOR_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gestores Vinculados</label>
                <div className="flex flex-wrap gap-2">
                  {GESTORES_OPTIONS.map((g) => {
                    const active = editSquadGestores.includes(g.toUpperCase());
                    return (
                      <button key={g} onClick={() => toggleGestor(g)}
                        className={`text-[11px] font-semibold px-3 py-1.5 rounded-md border transition-colors ${active ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground bg-muted/40 hover:border-primary/50"}`}>
                        {g}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSaveSquad} disabled={updateTeam.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {updateTeam.isPending && <Loader2 size={14} className="animate-spin" />}Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Configurar Squad ══ */}
      {squadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Configurar Novo Squad</h2>
              <button onClick={() => setSquadModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome da Unidade</label>
                <input type="text" placeholder="Ex: Squad Olympus" value={newSquadName} onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Supervisor Responsável</label>
                <select value={newSupervisor} onChange={(e) => setNewSupervisor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {SUPERVISOR_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleAtivarSquad} disabled={createTeam.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {createTeam.isPending && <Loader2 size={14} className="animate-spin" />}Ativar Squad
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Editar Grupo ══ */}
      {editGrupoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Editar Grupo</h2>
              <button onClick={() => setEditGrupoModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Nome do Grupo</label>
                <input type="text" value={editGrupoNome} onChange={(e) => setEditGrupoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">Gestor Responsável</label>
                <select value={editGrupoGestor} onChange={(e) => setEditGrupoGestor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {GESTORES_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2 block">SLA</label>
                <div className="flex gap-3">
                  {(["DENTRO DO SLA", "FORA DO SLA"] as GrupoSLA[]).map((sla) => (
                    <button key={sla} onClick={() => setEditGrupoSla(sla)}
                      className={`flex-1 py-2 rounded-lg border text-xs font-bold transition-colors ${editGrupoSla === sla ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                      {sla}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleSaveGrupo} disabled={updateGrupo.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {updateGrupo.isPending && <Loader2 size={14} className="animate-spin" />}Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Vincular Grupo ══ */}
      {grupoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-card rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-border">
              <h2 className="text-base font-bold uppercase tracking-wide text-foreground">Vincular Novo Grupo</h2>
              <button onClick={() => setGrupoModal(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome do Grupo (Exato do WhatsApp)</label>
                <input type="text" placeholder="Ex: Suporte VIP - Cliente X" value={newGrupoNome} onChange={(e) => setNewGrupoNome(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Gestor Responsável</label>
                <select value={newGrupoGestor} onChange={(e) => setNewGrupoGestor(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {GESTORES_OPTIONS.map((g) => <option key={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleIniciarMonitoramento} disabled={createGrupo.isPending}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-2">
                {createGrupo.isPending && <Loader2 size={14} className="animate-spin" />}Iniciar Monitoramento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
