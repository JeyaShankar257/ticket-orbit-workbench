import { useContext } from "react";

import { AuthContext, type AuthContextValue } from "@/lib/auth-context";

/**
 * Access the current Supabase session, trusted profile role, and auth actions.
 */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
