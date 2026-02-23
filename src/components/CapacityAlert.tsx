import { AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface CapacityAlertProps {
  current: number;
  max: number;
  label: string;
  compact?: boolean;
}

export function CapacityAlert({ current, max, label, compact = false }: CapacityAlertProps) {
  const percent = max > 0 ? Math.round((current / max) * 100) : 0;
  const isWarning = percent >= 90 && percent < 100;
  const isCritical = percent >= 100;

  const progressColor = isCritical
    ? "bg-destructive"
    : isWarning
    ? "bg-[hsl(var(--status-regular))]"
    : "bg-primary";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">
          {current}/{max}
        </span>
        {(isWarning || isCritical) && (
          <span
            className={`inline-flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
              isCritical
                ? "bg-destructive/15 text-destructive"
                : "bg-[hsl(var(--status-regular))]/15 text-[hsl(var(--status-regular))]"
            }`}
          >
            <AlertTriangle size={10} />
            {isCritical ? "LOTADO" : "ALERTA"}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium text-foreground">
          {current}/{max} ({percent}%)
        </span>
      </div>
      <Progress value={percent} className="h-2" />
      {(isWarning || isCritical) && (
        <div
          className={`flex items-center gap-1.5 text-xs font-medium ${
            isCritical ? "text-destructive" : "text-[hsl(var(--status-regular))]"
          }`}
        >
          <AlertTriangle size={12} />
          {isCritical
            ? "Capacidade máxima atingida — bloqueio ativo"
            : "Atenção: ≥ 90% da capacidade"}
        </div>
      )}
    </div>
  );
}
