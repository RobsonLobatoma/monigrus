import { useState } from "react";
import {
  Settings, Globe, Users, LayoutGrid, Hash, Shield, Save, History,
  Search, UserPlus, Pencil, Trash2, X, Target, Plus, MoreVertical,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

/* ─── Usuários & Cargos data ─── */
const CARGO_COLORS: Record<string, string> = {
  DIRETOR: "text-purple-600 bg-purple-100 dark:bg-purple-900/30 dark:text-purple-400",
  GERENTE: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
  SUPERVISOR: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
  "GESTOR DE TRÁFEGO": "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400",
};
const CARGOS = ["Diretor", "Gerente", "Supervisor", "Gestor de Tráfego"];
const SQUAD_OPTIONS = ["MASTER", "ELITE", "SQT1", "SQT2", "SQT3"];

const initialUsers = [
  { id: 1, name: "Dr. Ricardo",    email: "diretor@sistema.com", cargo: "DIRETOR",          squad: "MASTER" },
  { id: 2, name: "Ana Maria",      email: "gerente@sistema.com", cargo: "GERENTE",           squad: "ELITE"  },
  { id: 3, name: "Carlos Eduardo", email: "carlos@sistema.com",  cargo: "SUPERVISOR",        squad: "SQT1"   },
  { id: 4, name: "Seu Madruga",    email: "madruga@sistema.com", cargo: "GESTOR DE TRÁFEGO", squad: "SQT1"   },
];

/* ─── Gestão de Squads data ─── */
const SUPERVISOR_OPTIONS = ["Carlos Eduardo", "Karla Mendes", "João Lima", "Ana Maria"];

const initialSquads = [
  { id: 1, name: "SQT1", supervisor: "Carlos Eduardo", supervisorInitial: "C", gestores: ["SEU MADRUGA", "PATRÍCIA"] },
  { id: 2, name: "SQT2", supervisor: "Karla Mendes",   supervisorInitial: "K", gestores: ["KARLA", "ROBERTO"] },
  { id: 3, name: "SQT3", supervisor: "João Lima",      supervisorInitial: "J", gestores: ["JOÃO LIMA", "ANDRÉ"] },
];

/* ─── Avatar color map ─── */
const AVATAR_COLORS: Record<string, string> = {
  C: "bg-green-500",
  K: "bg-blue-500",
  J: "bg-orange-500",
  A: "bg-purple-500",
  D: "bg-red-500",
  S: "bg-teal-500",
};

export default function Configuracoes() {
  /* Usuários state */
  const [users, setUsers]         = useState(initialUsers);
  const [search, setSearch]       = useState("");
  const [userModal, setUserModal] = useState(false);
  const [newName, setNewName]     = useState("");
  const [newCargo, setNewCargo]   = useState("Diretor");
  const [newSquad, setNewSquad]   = useState("SQT1");

  /* Squads state */
  const [squads, setSquads]             = useState(initialSquads);
  const [squadModal, setSquadModal]     = useState(false);
  const [newSquadName, setNewSquadName] = useState("");
  const [newSupervisor, setNewSupervisor] = useState("Carlos Eduardo");

  /* ── handlers ── */
  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCadastrarUser = () => {
    if (!newName.trim()) return;
    setUsers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newName.trim(),
        email: `${newName.trim().toLowerCase().replace(/\s+/g, ".")}@sistema.com`,
        cargo: newCargo.toUpperCase(),
        squad: newSquad,
      },
    ]);
    setNewName(""); setNewCargo("Diretor"); setNewSquad("SQT1");
    setUserModal(false);
  };

  const handleDeleteUser = (id: number) =>
    setUsers((prev) => prev.filter((u) => u.id !== id));

  const handleAtivarSquad = () => {
    if (!newSquadName.trim()) return;
    const sup = newSupervisor;
    setSquads((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newSquadName.trim().toUpperCase(),
        supervisor: sup,
        supervisorInitial: sup.charAt(0).toUpperCase(),
        gestores: [],
      },
    ]);
    setNewSquadName(""); setNewSupervisor("Carlos Eduardo");
    setSquadModal(false);
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Settings className="w-7 h-7 text-primary" />
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestão de Hierarquia e Acessos</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Administração de usuários, cargos, squads e permissões RBAC.
            </p>
          </div>
        </div>
        <Button className="flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-5">
          <Save size={16} />
          Salvar Tudo
        </Button>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0">
          {[
            { value: "visao-geral",          icon: <Globe size={15} />,      label: "Visão Geral" },
            { value: "usuarios-cargos",       icon: <Users size={15} />,      label: "Usuários & Cargos" },
            { value: "gestao-squads",         icon: <LayoutGrid size={15} />, label: "Gestão de Squads" },
            { value: "gestao-grupos",         icon: <Hash size={15} />,       label: "Gestão de Grupos" },
            { value: "hierarquia-permissoes", icon: <Shield size={15} />,     label: "Hierarquia & Permissões" },
          ].map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
            >
              {tab.icon}
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ════ Visão Geral ════ */}
        <TabsContent value="visao-geral" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl p-6 text-white" style={{ background: "linear-gradient(135deg, #3b5bdb 0%, #6741d9 100%)" }}>
              <div className="flex items-center gap-3 mb-4">
                <Globe size={22} className="text-white" />
                <h2 className="text-xl font-bold">Sistema de Acesso Inteligente</h2>
              </div>
              <p className="text-sm text-white/85 leading-relaxed mb-6">
                Esta área controla a visibilidade de usuários, grupos e acessos operacionais. As
                permissões são baseadas em cargos (RBAC) e o sistema se adapta ao seu nível hierárquico.
              </p>
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-sm font-mono text-white/80 italic">
                  "SIMULAÇÃO FRONT-END (SEM BACKEND)"
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-card p-6 flex flex-col items-center justify-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                <Shield size={26} className="text-primary" />
              </div>
              <h2 className="text-base font-semibold text-foreground">Matriz de Auditoria</h2>
              <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                Todas as mudanças de cargos e squads são registradas para auditoria de segurança.
              </p>
              <button className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium mt-1">
                <History size={14} />
                Ver Histórico de Auditoria
              </button>
            </div>
          </div>
        </TabsContent>

        {/* ════ Usuários & Cargos ════ */}
        <TabsContent value="usuarios-cargos" className="mt-6">
          <div className="flex items-center justify-between mb-5">
            <div className="relative w-72">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filtrar usuário..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-full border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <button
              onClick={() => setUserModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              <UserPlus size={16} />
              Novo Usuário
            </button>
          </div>

          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] px-6 py-3 border-b border-border">
              {["COLABORADOR", "CARGO", "SQUAD", "STATUS", "AÇÕES"].map((h) => (
                <span key={h} className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">{h}</span>
              ))}
            </div>
            {filteredUsers.map((user) => {
              const initial = user.name.charAt(0).toUpperCase();
              const cargoClass = CARGO_COLORS[user.cargo] ?? "text-muted-foreground bg-muted";
              return (
                <div key={user.id} className="grid grid-cols-[2fr_1.5fr_1fr_1fr_80px] items-center px-6 py-4 border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-bold text-primary">{initial}</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div>
                    <span className={`inline-block text-[11px] font-bold tracking-wide px-2.5 py-1 rounded-md ${cargoClass}`}>
                      {user.cargo}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-foreground">{user.squad}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />
                  </div>
                  <div className="flex items-center gap-3">
                    <button className="text-muted-foreground hover:text-foreground transition-colors"><Pencil size={15} /></button>
                    <button onClick={() => handleDeleteUser(user.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={15} /></button>
                  </div>
                </div>
              );
            })}
            {filteredUsers.length === 0 && (
              <div className="py-12 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</div>
            )}
          </div>
        </TabsContent>

        {/* ════ Gestão de Squads ════ */}
        <TabsContent value="gestao-squads" className="mt-6">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-sm font-bold uppercase tracking-widest text-foreground">Estrutura Operacional</h2>
            <button
              onClick={() => setSquadModal(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors"
            >
              <Plus size={16} />
              Novo Squad
            </button>
          </div>

          {/* Squad cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {squads.map((squad) => {
              const avatarBg = AVATAR_COLORS[squad.supervisorInitial] ?? "bg-primary";
              return (
                <div key={squad.id} className="rounded-xl border border-border bg-card p-5 space-y-4">
                  {/* Card top */}
                  <div className="flex items-start justify-between">
                    <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Target size={22} className="text-primary" />
                    </div>
                    <button className="text-muted-foreground hover:text-foreground transition-colors">
                      <MoreVertical size={16} />
                    </button>
                  </div>

                  {/* Squad name */}
                  <p className="text-xl font-bold text-foreground">{squad.name}</p>

                  {/* Supervisor */}
                  <div className="rounded-lg border border-dashed border-border p-3">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                      Supervisor Resp.
                    </p>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full ${avatarBg} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-xs font-bold text-white">{squad.supervisorInitial}</span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{squad.supervisor}</span>
                    </div>
                  </div>

                  {/* Gestores */}
                  {squad.gestores.length > 0 && (
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                        Gestores Vinculados ({squad.gestores.length})
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {squad.gestores.map((g) => (
                          <span
                            key={g}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-md border border-border text-muted-foreground bg-muted/40 uppercase tracking-wide"
                          >
                            {g}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ════ Gestão de Grupos ════ */}
        <TabsContent value="gestao-grupos" className="mt-6"><div /></TabsContent>

        {/* ════ Hierarquia & Permissões ════ */}
        <TabsContent value="hierarquia-permissoes" className="mt-6"><div /></TabsContent>
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
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Nome Completo</label>
                <input
                  type="text"
                  placeholder="Ex: Roberto Silva"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Cargo Hierárquico</label>
                  <select value={newCargo} onChange={(e) => setNewCargo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {CARGOS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Squad Destino</label>
                  <select value={newSquad} onChange={(e) => setNewSquad(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                    {SQUAD_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleCadastrarUser} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                Cadastrar Colaborador
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ Modal: Configurar Novo Squad ══ */}
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
                <input
                  type="text"
                  placeholder="Ex: Squad Olympus"
                  value={newSquadName}
                  onChange={(e) => setNewSquadName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Supervisor Responsável</label>
                <select value={newSupervisor} onChange={(e) => setNewSupervisor(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border border-border bg-muted/40 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40">
                  {SUPERVISOR_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="px-6 pb-6">
              <button onClick={handleAtivarSquad} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                Ativar Squad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
