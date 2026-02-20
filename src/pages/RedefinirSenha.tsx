import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function RedefinirSenha() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Supabase redirects with #access_token=...&type=recovery in the URL hash
    const hash = window.location.hash;
    if (hash.includes("type=recovery") || hash.includes("access_token")) {
      setValidToken(true);
    }

    // Also listen for the SIGNED_IN event after recovery link click
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setValidToken(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({ title: "Senhas não coincidem", variant: "destructive" });
      return;
    }
    if (password.length < 6) {
      toast({ title: "Senha muito curta", description: "Mínimo de 6 caracteres.", variant: "destructive" });
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }

    setDone(true);
    setTimeout(() => navigate("/login", { replace: true }), 2500);
  }

  if (!validToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted px-4">
        <div className="bg-card rounded-xl border border-border p-8 max-w-md w-full text-center">
          <p className="text-muted-foreground">Link inválido ou expirado. Solicite um novo link de recuperação.</p>
          <Button className="mt-4" onClick={() => navigate("/recuperar-senha")}>
            Solicitar novo link
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted px-4">
      <div className="w-full max-w-md">
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
          {done ? (
            <div className="text-center space-y-4">
              <CheckCircle className="mx-auto text-green-500" size={48} />
              <h2 className="text-lg font-semibold text-foreground">Senha redefinida!</h2>
              <p className="text-sm text-muted-foreground">Redirecionando para o login...</p>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-foreground">Redefinir senha</h2>
                <p className="text-sm text-muted-foreground mt-1">Escolha uma nova senha para sua conta.</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="password">Nova senha</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="confirmPassword">Confirmar senha</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Repita a senha"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Salvando..." : "Redefinir senha"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
