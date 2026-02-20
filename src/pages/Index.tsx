import { Link } from "react-router-dom";
import { Monitor } from "lucide-react";

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <Monitor className="text-primary" size={32} />
      </div>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">MONIGRU</h1>
        <p className="text-muted-foreground max-w-sm">
          Sistema de Monitoramento de Grupos. Acesse o painel de monitoramento para visualizar os dados.
        </p>
      </div>
      <Link
        to="/monitoramento"
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
      >
        <Monitor size={16} />
        Ir para Monitoramento
      </Link>
    </div>
  );
};

export default Index;
