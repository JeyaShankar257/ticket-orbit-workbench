import { supabase } from "./supabase";

export type UserRole = "employee" | "support" | "admin";

const VALID_ROLES: ReadonlySet<string> = new Set<UserRole>(["employee", "support", "admin"]);

export function parseTrustedRole(value: unknown): UserRole | null {
  if (typeof value === "string" && VALID_ROLES.has(value)) {
    return value as UserRole;
  }
  return null;
}

export interface TrustedProfileResult {
  role: UserRole | null;
  fullName: string | null;
  error: string | null;
}

/**
 * Retrieve trusted role and full_name from public.profiles.
 * Never reads or trusts user_metadata.role.
 */
export async function fetchTrustedProfile(userId: string): Promise<TrustedProfileResult> {
  const { data, error } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    return {
      role: null,
      fullName: null,
      error: "Unable to verify user profile.",
    };
  }

  if (!data) {
    return {
      role: null,
      fullName: null,
      error: "User profile not found.",
    };
  }

  const trustedRole = parseTrustedRole(data.role);
  const fullName =
    typeof data.full_name === "string" && data.full_name.trim() ? data.full_name : null;

  if (!trustedRole) {
    return {
      role: null,
      fullName,
      error: "User profile has an invalid or missing role.",
    };
  }

  return {
    role: trustedRole,
    fullName,
    error: null,
  };
}
