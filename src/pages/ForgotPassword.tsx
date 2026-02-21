import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Mail, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ForgotPassword() {
  const { resetPassword } = useAuth();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    const { error } = await resetPassword(email.trim());
    setLoading(false);
    if (error) {
      toast({ variant: "destructive", title: "Erro", description: error.message });
    } else {
      setSent(true);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary flex items-center justify-center">
            <Shield className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">Recuperar Senha</CardTitle>
          <CardDescription>Informe seu email para receber o link de recuperação</CardDescription>
        </CardHeader>
        {sent ? (
          <CardContent className="text-center space-y-4 pb-6">
            <CheckCircle className="w-12 h-12 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">
              Enviamos um link de recuperação para <strong>{email}</strong>. Verifique sua caixa de entrada.
            </p>
            <Link to="/login" className="text-sm text-primary hover:underline font-medium">Voltar ao login</Link>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="seu@email.com" className="pl-9" value={email} onChange={(e) => setEmail(e.target.value)} required maxLength={255} />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Enviar link"}
              </Button>
              <Link to="/login" className="text-sm text-primary hover:underline font-medium">Voltar ao login</Link>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  );
}
