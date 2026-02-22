import { useState } from "react";
import { Plus, Pencil, Trash2, X, Save, Eye, Tag, BarChart3, CheckCircle } from "lucide-react";
import {
  useMonitoringSettings,
  useCreateMonitoringSetting,
  useUpdateMonitoringSetting,
  useDeleteMonitoringSetting,
  type MonitoringCategory,
  type MonitoringSetting,
} from "@/hooks/useMonitoringSettings";

/* ─── Shared inline editing state ─── */
interface EditState {
  id: string | null;
  label: string;
  color: string;
  min_value: string;
  max_value: string;
  is_active: boolean;
}
const emptyEdit: EditState = { id: null, label: "", color: "#22c55e", min_value: "", max_value: "", is_active: true };

/* ─── Generic CRUD Card ─── */
function SettingsCard({
  title,
  icon,
  category,
  showColor,
  showRange,
  showActive,
}: {
  title: string;
  icon: React.ReactNode;
  category: MonitoringCategory;
  showColor?: boolean;
  showRange?: boolean;
  showActive?: boolean;
}) {
  const { data: items = [], isLoading } = useMonitoringSettings(category);
  const createMutation = useCreateMonitoringSetting();
  const updateMutation = useUpdateMonitoringSetting();
  const deleteMutation = useDeleteMonitoringSetting();

  const [adding, setAdding] = useState(false);
  const [edit, setEdit] = useState<EditState>(emptyEdit);

  const startAdd = () => {
    setAdding(true);
    setEdit({ ...emptyEdit });
  };
  const startEdit = (item: MonitoringSetting) => {
    setAdding(false);
    setEdit({
      id: item.id,
      label: item.label,
      color: item.color || "#22c55e",
      min_value: item.min_value?.toString() ?? "",
      max_value: item.max_value?.toString() ?? "",
      is_active: item.is_active,
    });
  };
  const cancel = () => { setAdding(false); setEdit(emptyEdit); };

  const handleSave = () => {
    if (!edit.label.trim()) return;
    const payload: any = {
      category,
      label: edit.label.trim(),
      color: showColor ? edit.color : "",
      is_active: edit.is_active,
      sort_order: items.length + 1,
    };
    if (showRange) {
      payload.min_value = edit.min_value ? parseInt(edit.min_value) : null;
      payload.max_value = edit.max_value ? parseInt(edit.max_value) : null;
    }
    if (adding) {
      createMutation.mutate(payload, { onSuccess: cancel });
    } else if (edit.id) {
      updateMutation.mutate({ id: edit.id, ...payload }, { onSuccess: cancel });
    }
  };

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id);
    if (edit.id === id) cancel();
  };

  const isEditing = adding || edit.id !== null;

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">{title}</h3>
          <span className="text-xs text-muted-foreground ml-1">({items.length})</span>
        </div>
        {!isEditing && (
          <button
            onClick={startAdd}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            <Plus size={14} /> Novo
          </button>
        )}
      </div>

      {/* Table header */}
      <div className={`grid ${showRange ? "grid-cols-[1fr_80px_80px_80px_80px]" : showActive ? "grid-cols-[1fr_80px_80px]" : "grid-cols-[1fr_80px_80px]"} px-6 py-2.5 border-b border-border`}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {category === "PALAVRA_CHAVE" ? "PALAVRA" : "LABEL"}
        </span>
        {showRange && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">MÍN</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">MÁX</span>
          </>
        )}
        {showColor && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">COR</span>
        )}
        {showActive && (
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">STATUS</span>
        )}
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-center">AÇÕES</span>
      </div>

      {/* Rows */}
      {isLoading && (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">Carregando...</div>
      )}
      {items.map((item) => {
        const isThisEditing = edit.id === item.id;
        return (
          <div
            key={item.id}
            className={`grid ${showRange ? "grid-cols-[1fr_80px_80px_80px_80px]" : showActive ? "grid-cols-[1fr_80px_80px]" : "grid-cols-[1fr_80px_80px]"} items-center px-6 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors`}
          >
            {isThisEditing ? (
              <>
                <input
                  type="text"
                  value={edit.label}
                  onChange={(e) => setEdit({ ...edit, label: e.target.value })}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 mr-2"
                  autoFocus
                />
                {showRange && (
                  <>
                    <input
                      type="number"
                      value={edit.min_value}
                      onChange={(e) => setEdit({ ...edit, min_value: e.target.value })}
                      className="w-16 mx-auto px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="0"
                    />
                    <input
                      type="number"
                      value={edit.max_value}
                      onChange={(e) => setEdit({ ...edit, max_value: e.target.value })}
                      className="w-16 mx-auto px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                      placeholder="100"
                    />
                  </>
                )}
                {showColor && (
                  <div className="flex justify-center">
                    <input
                      type="color"
                      value={edit.color}
                      onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
                  </div>
                )}
                {showActive && (
                  <div className="flex justify-center">
                    <button
                      onClick={() => setEdit({ ...edit, is_active: !edit.is_active })}
                      className={`text-xs font-bold px-2 py-1 rounded ${edit.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                    >
                      {edit.is_active ? "Ativo" : "Inativo"}
                    </button>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <button onClick={handleSave} className="text-primary hover:text-primary/80"><Save size={15} /></button>
                  <button onClick={cancel} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  {showColor && item.color && (
                    <span
                      className="inline-block w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                  )}
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </div>
                {showRange && (
                  <>
                    <span className="text-sm text-muted-foreground text-center">{item.min_value ?? "—"}</span>
                    <span className="text-sm text-muted-foreground text-center">{item.max_value ?? "—"}</span>
                  </>
                )}
                {showColor && !showRange && (
                  <div className="flex justify-center">
                    <span
                      className="inline-flex items-center justify-center text-[11px] font-bold px-2.5 py-1 rounded-md text-white"
                      style={{ backgroundColor: item.color || "#888" }}
                    >
                      {item.label}
                    </span>
                  </div>
                )}
                {showActive && (
                  <div className="flex justify-center">
                    <span
                      className={`text-[11px] font-bold px-2 py-1 rounded ${item.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                    >
                      {item.is_active ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-center gap-2">
                  <button onClick={() => startEdit(item)} className="text-muted-foreground hover:text-foreground transition-colors"><Pencil size={14} /></button>
                  <button onClick={() => handleDelete(item.id)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                </div>
              </>
            )}
          </div>
        );
      })}

      {/* Inline add row */}
      {adding && (
        <div className={`grid ${showRange ? "grid-cols-[1fr_80px_80px_80px_80px]" : showActive ? "grid-cols-[1fr_80px_80px]" : "grid-cols-[1fr_80px_80px]"} items-center px-6 py-3 border-t border-border bg-muted/20`}>
          <input
            type="text"
            value={edit.label}
            onChange={(e) => setEdit({ ...edit, label: e.target.value })}
            placeholder={category === "PALAVRA_CHAVE" ? "Nova palavra..." : "Novo label..."}
            className="px-3 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 mr-2"
            autoFocus
          />
          {showRange && (
            <>
              <input
                type="number"
                value={edit.min_value}
                onChange={(e) => setEdit({ ...edit, min_value: e.target.value })}
                className="w-16 mx-auto px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="0"
              />
              <input
                type="number"
                value={edit.max_value}
                onChange={(e) => setEdit({ ...edit, max_value: e.target.value })}
                className="w-16 mx-auto px-2 py-1.5 rounded-lg border border-border bg-background text-sm text-foreground text-center focus:outline-none focus:ring-2 focus:ring-primary/40"
                placeholder="100"
              />
            </>
          )}
          {showColor && (
            <div className="flex justify-center">
              <input
                type="color"
                value={edit.color}
                onChange={(e) => setEdit({ ...edit, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer border-0"
              />
            </div>
          )}
          {showActive && (
            <div className="flex justify-center">
              <button
                onClick={() => setEdit({ ...edit, is_active: !edit.is_active })}
                className={`text-xs font-bold px-2 py-1 rounded ${edit.is_active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
              >
                {edit.is_active ? "Ativo" : "Inativo"}
              </button>
            </div>
          )}
          <div className="flex items-center justify-center gap-2">
            <button onClick={handleSave} className="text-primary hover:text-primary/80"><Save size={15} /></button>
            <button onClick={cancel} className="text-muted-foreground hover:text-foreground"><X size={15} /></button>
          </div>
        </div>
      )}

      {!isLoading && items.length === 0 && !adding && (
        <div className="px-6 py-8 text-center text-sm text-muted-foreground">Nenhum item cadastrado.</div>
      )}
    </div>
  );
}

/* ─── Main Tab Content ─── */
export default function MonitoringSettingsTab() {
  return (
    <div className="space-y-6">
      <SettingsCard
        title="Palavras Chave"
        icon={<Tag size={16} className="text-primary" />}
        category="PALAVRA_CHAVE"
        showActive
      />
      <SettingsCard
        title="Satisfação"
        icon={<Eye size={16} className="text-primary" />}
        category="SATISFACAO"
        showColor
      />
      <SettingsCard
        title="Score"
        icon={<BarChart3 size={16} className="text-primary" />}
        category="SCORE"
        showColor
        showRange
      />
      <SettingsCard
        title="Status"
        icon={<CheckCircle size={16} className="text-primary" />}
        category="STATUS"
        showColor
      />
    </div>
  );
}
