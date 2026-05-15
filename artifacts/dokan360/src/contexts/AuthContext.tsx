import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";
import { setAuthTokenGetter } from "@workspace/api-client-react";
import type { Session } from "@supabase/supabase-js";

interface AppUser {
  id:           number;
  name:         string;
  displayName:  string;
  email:        string;
  role:         string;
  shopId:       number;
  shopName:     string;
  isActive:     boolean;
  employeePhoto?: string | null;
}

interface AuthContextType {
  user:      AppUser | null;
  token:     string | null;
  role:      string | null;
  logout:    () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session,   setSession]   = useState<Session | null>(null);
  const [appUser,   setAppUser]   = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();
  const qc = useQueryClient();

  const fetchAppUser = useCallback(async (accessToken: string): Promise<void> => {
    try {
      const resp = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!resp.ok) { setAppUser(null); return; }
      const data = await resp.json();
      setAppUser(data);
    } catch {
      setAppUser(null);
    }
  }, []);

  useEffect(() => {
    // ─── Initial session check ───────────────────────────────────────────────
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.access_token) {
        setAuthTokenGetter(() => s.access_token);
        fetchAppUser(s.access_token).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    // ─── Auth state changes ──────────────────────────────────────────────────
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);

      if (s?.access_token) {
        setAuthTokenGetter(() => s.access_token);

        if (_event === "SIGNED_IN") {
          // Show the global loading overlay while we fetch the app user profile.
          // This prevents the ProtectedRoute from briefly redirecting to /login
          // before the user object is ready (was the cause of the "stop" freeze).
          setIsLoading(true);
          fetchAppUser(s.access_token).finally(() => {
            setIsLoading(false);
            setLocation("/");      // Navigate AFTER user is ready
          });
        } else {
          // TOKEN_REFRESHED and other events: silently refresh user profile
          fetchAppUser(s.access_token);
        }
      } else {
        setAuthTokenGetter(() => null);
        setAppUser(null);
        qc.clear();
        if (_event === "SIGNED_OUT") setLocation("/login");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.access_token) {
      setAuthTokenGetter(() => session.access_token);
    }
  }, [session?.access_token]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  return (
    <AuthContext.Provider value={{
      user:      appUser,
      token:     session?.access_token ?? null,
      role:      appUser?.role ?? null,
      logout,
      isLoading,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
