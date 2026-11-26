import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";

import { fetchTrustedProfile, type UserRole } from "./auth-helpers";
import { supabase } from "./supabase";

export type { UserRole };

export interface AuthContextValue {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  fullName: string | null;
  loading: boolean;
  profileError: string | null;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Provides Supabase authentication state and trusted role/profile metadata.
 *
 * SSR-safe: initializes with `loading: true` and only reads/subscribes to
 * browser session state inside `useEffect`.
 * Role is always fetched from `profiles.role` — never from `user_metadata`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const loadedUserIdRef = useRef<string | null>(null);

  const loadProfile = useCallback(async (userId: string) => {
    const result = await fetchTrustedProfile(userId);
    setRole(result.role);
    setFullName(result.fullName);
    setProfileError(result.error);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setRole(null);
      setFullName(null);
      setProfileError(null);
      return;
    }
    await loadProfile(session.user.id);
  }, [loadProfile, session?.user?.id]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    loadedUserIdRef.current = null;
    setSession(null);
    setRole(null);
    setFullName(null);
    setProfileError(null);
  }, []);

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const {
          data: { session: initialSession },
        } = await supabase.auth.getSession();

        if (!active) return;

        const initialUserId = initialSession?.user?.id ?? null;
        loadedUserIdRef.current = initialUserId;
        setSession(initialSession);

        if (initialUserId) {
          await loadProfile(initialUserId);
        } else {
          setRole(null);
          setFullName(null);
          setProfileError(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active) return;

      const nextUserId = nextSession?.user?.id ?? null;
      setSession(nextSession);

      if (!nextUserId) {
        loadedUserIdRef.current = null;
        setRole(null);
        setFullName(null);
        setProfileError(null);
        setLoading(false);
        return;
      }

      // Preserve mounted workspace during token refreshes or repeated SIGNED_IN events
      // for the already-authenticated user (e.g. browser tab focus/visibility changes).
      if (nextUserId === loadedUserIdRef.current) {
        if (event !== "TOKEN_REFRESHED") {
          void loadProfile(nextUserId);
        }
        return;
      }

      loadedUserIdRef.current = nextUserId;
      setLoading(true);
      void loadProfile(nextUserId).finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user: session?.user ?? null,
      role,
      fullName,
      loading,
      profileError,
      signOut,
      refreshProfile,
    }),
    [session, role, fullName, loading, profileError, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
