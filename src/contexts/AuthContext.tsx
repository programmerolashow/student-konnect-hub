import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Tables } from "@/integrations/supabase/types";

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Tables<"profiles"> | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", userId)
      .single();
    setProfile(data);
  };

  const setOnlineStatus = useCallback(async (userId: string, online: boolean) => {
    await supabase.from("profiles").update({ online }).eq("user_id", userId);
  }, []);

  const refreshProfile = async () => {
    if (session?.user?.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id);
            setOnlineStatus(session.user.id, true);
          }, 0);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user.id);
        setOnlineStatus(session.user.id, true);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Track online/offline via browser events
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    const goOffline = () => setOnlineStatus(userId, false);
    const goOnline = () => setOnlineStatus(userId, true);

    window.addEventListener("beforeunload", goOffline);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") goOffline();
      else goOnline();
    });

    return () => {
      window.removeEventListener("beforeunload", goOffline);
      goOffline();
    };
  }, [session?.user?.id, setOnlineStatus]);

  const signOut = async () => {
    if (session?.user?.id) {
      await setOnlineStatus(session.user.id, false);
    }
    await supabase.auth.signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        loading,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
