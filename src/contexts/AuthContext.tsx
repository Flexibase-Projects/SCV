import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { PropsWithChildren } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  updatePassword: (password: string) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const getResetPasswordUrl = () => new URL("/redefinir-senha", window.location.origin).toString();

export function AuthProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const applySession = (nextSession: Session | null) => {
      if (!active) return;

      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      setIsLoading(false);
    };

    supabase.auth
      .getSession()
      .then(({ data, error }) => {
        if (error) {
          applySession(null);
          return;
        }

        applySession(data.session ?? null);
      })
      .catch(() => {
        applySession(null);
      });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      isLoading,
      async signInWithPassword(email: string, password: string) {
        const { error } = await supabase.auth.signInWithPassword({ email, password });

        if (error) {
          throw error;
        }
      },
      async signOut() {
        const { error } = await supabase.auth.signOut();

        if (error) {
          throw error;
        }
      },
      async sendPasswordResetEmail(email: string) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: getResetPasswordUrl(),
        });

        if (error) {
          throw error;
        }
      },
      async updatePassword(password: string) {
        const { error } = await supabase.auth.updateUser({ password });

        if (error) {
          throw error;
        }
      },
    }),
    [isLoading, session, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}

export { getResetPasswordUrl };
