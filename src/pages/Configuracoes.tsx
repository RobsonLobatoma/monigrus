import { Settings, Globe, Users, LayoutGrid, Hash, Shield, Save, History } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

export default function Configuracoes() {
  return (
    <div className="space-y-6">
      {/* Header */}
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

      {/* Tabs */}
      <Tabs defaultValue="visao-geral" className="w-full">
        <TabsList className="bg-transparent border-b border-border rounded-none h-auto p-0 w-full justify-start gap-0">
          <TabsTrigger
            value="visao-geral"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Globe size={15} />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger
            value="usuarios-cargos"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Users size={15} />
            Usuários & Cargos
          </TabsTrigger>
          <TabsTrigger
            value="gestao-squads"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <LayoutGrid size={15} />
            Gestão de Squads
          </TabsTrigger>
          <TabsTrigger
            value="gestao-grupos"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Hash size={15} />
            Gestão de Grupos
          </TabsTrigger>
          <TabsTrigger
            value="hierarquia-permissoes"
            className="flex items-center gap-2 rounded-none border-b-2 border-transparent px-4 py-3 text-sm font-medium text-muted-foreground data-[state=active]:border-primary data-[state=active]:text-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
          >
            <Shield size={15} />
            Hierarquia & Permissões
          </TabsTrigger>
        </TabsList>

        {/* Visão Geral */}
        <TabsContent value="visao-geral" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Sistema de Acesso Inteligente */}
            <div className="rounded-xl p-6 text-white" style={{ background: "linear-gradient(135deg, #3b5bdb 0%, #6741d9 100%)" }}>
              <div className="flex items-center gap-3 mb-4">
                <Globe size={22} className="text-white" />
                <h2 className="text-xl font-bold">Sistema de Acesso Inteligente</h2>
              </div>
              <p className="text-sm text-white/85 leading-relaxed mb-6">
                Esta área controla a visibilidade de usuários, grupos e acessos operacionais. As
                permissões são baseadas em cargos (RBAC) e o sistema se adapta ao seu nível
                hierárquico.
              </p>
              <div className="rounded-lg border border-white/20 bg-white/10 px-4 py-3">
                <p className="text-sm font-mono text-white/80 italic">
                  "SIMULAÇÃO FRONT-END (SEM BACKEND)"
                </p>
              </div>
            </div>

            {/* Matriz de Auditoria */}
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

        {/* Usuários & Cargos */}
        <TabsContent value="usuarios-cargos" className="mt-6">
          <div />
        </TabsContent>

        {/* Gestão de Squads */}
        <TabsContent value="gestao-squads" className="mt-6">
          <div />
        </TabsContent>

        {/* Gestão de Grupos */}
        <TabsContent value="gestao-grupos" className="mt-6">
          <div />
        </TabsContent>

        {/* Hierarquia & Permissões */}
        <TabsContent value="hierarquia-permissoes" className="mt-6">
          <div />
        </TabsContent>
      </Tabs>
    </div>
  );
}
