import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AppRole = "DIRETOR" | "GERENTE" | "SUPERVISOR" | "OPERACIONAL";

interface UserProfile {
  user_id: string;
  full_name: string;
  email: string;
  team_id: string | null;
  sector_id: string | null;
  is_active: boolean;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  role: AppRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  profile: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfileAndRole(userId: string) {
    const [profileRes, roleRes] = await Promise.all([
      supabase
        .from("user_profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle(),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle(),
    ]);

    setProfile(profileRes.data ?? null);
    setRole((roleRes.data?.role as AppRole) ?? null);
  }

  useEffect(() => {
    // Set up listener BEFORE getSession
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          // Defer to avoid Supabase deadlock inside the callback
          setTimeout(() => fetchProfileAndRole(newSession.user.id), 0);
        } else {
          setProfile(null);
          setRole(null);
        }

        if (event === "INITIAL_SESSION") {
          setLoading(false);
        }
      }
    );

    // Restore existing session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) fetchProfileAndRole(s.user.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user, profile, role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
