import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RecuperarSenha() {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8 gap-3">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg">
            <span className="text-primary-foreground font-bold text-3xl">M</span>
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-foreground tracking-wide">MONIGRU</h1>
            <p className="text-sm text-muted-foreground mt-1">Sistema de Monitoramento de Grupos</p>
          </div>
        </div>

        <div className="bg-card rounded-xl shadow-md border border-border p-8">
          {sent ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto text-green-500" size={48} />
              <h2 className="text-lg font-semibold text-foreground">E-mail enviado!</h2>
              <p className="text-sm text-muted-foreground">
                Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.
              </p>
              <Link to="/login">
                <Button variant="outline" className="mt-2 gap-2">
                  <ArrowLeft size={16} /> Voltar ao login
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Recuperar senha</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Informe seu e-mail e enviaremos um link para redefinir sua senha.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Enviando..." : "Enviar link de recuperação"}
                </Button>
              </form>

              <p className="text-center text-sm text-muted-foreground mt-6">
                <Link to="/login" className="text-primary hover:underline flex items-center justify-center gap-1">
                  <ArrowLeft size={14} /> Voltar ao login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
