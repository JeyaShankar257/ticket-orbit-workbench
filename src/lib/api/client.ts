import { supabase } from "@/lib/supabase";

const API_BASE_URL = (import.meta.env["VITE_API_BASE_URL"] as string | undefined) ?? "";

export class ApiError extends Error {
  readonly status: number;
  readonly detail: unknown;

  constructor(status: number, message: string, detail?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

let refreshInFlightPromise: Promise<string> | null = null;

/**
 * Single-flight session refresh so concurrent 401 or near-expiry calls
 * share one refreshSession() request instead of racing.
 */
async function refreshAccessTokenSingleFlight(): Promise<string> {
  if (!refreshInFlightPromise) {
    refreshInFlightPromise = (async () => {
      const {
        data: { session: refreshed },
        error: refreshError,
      } = await supabase.auth.refreshSession();

      if (refreshError || !refreshed?.access_token) {
        throw new ApiError(401, "Your session has expired. Please sign in again.");
      }

      return refreshed.access_token;
    })().finally(() => {
      refreshInFlightPromise = null;
    });
  }

  return refreshInFlightPromise;
}

/**
 * Retrieve a valid Supabase access token for the current session.
 * Attempts a token refresh if the session is expired or about to expire.
 */
async function getValidAccessToken(): Promise<string> {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error || !session) {
    throw new ApiError(401, "Authentication required. Please sign in.");
  }

  const nowSeconds = Math.floor(Date.now() / 1000);
  const expiresAt = session.expires_at ?? 0;

  if (!session.access_token || (expiresAt > 0 && expiresAt - nowSeconds < 30)) {
    return refreshAccessTokenSingleFlight();
  }

  return session.access_token;
}

const DEFAULT_TIMEOUT_MS = 30_000;

export interface ApiFetchOptions extends RequestInit {
  timeoutMs?: number;
}

async function executeFetchWithToken(
  path: string,
  fetchOptions: RequestInit,
  accessToken: string,
  timeoutMs: number,
  externalSignal?: AbortSignal | null,
): Promise<Response> {
  const headers = new Headers(fetchOptions.headers);
  headers.set("Authorization", `Bearer ${accessToken}`);
  headers.set("Accept", "application/json");

  if (fetchOptions.body && typeof fetchOptions.body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const controller = new AbortController();
  let timedOut = false;

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener("abort", onExternalAbort, { once: true });
    }
  }

  const timerId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });
  } catch (err) {
    if (timedOut) {
      throw new ApiError(408, "Request timed out. Please try again.");
    }
    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(499, "Request was cancelled.");
    }
    throw new ApiError(0, "Network error. Please check your connection and try again.");
  } finally {
    clearTimeout(timerId);
    externalSignal?.removeEventListener("abort", onExternalAbort);
  }
}

/**
 * Authenticated fetch wrapper for FastAPI endpoints.
 * Automatically attaches the Supabase Bearer access token, enforces a request timeout,
 * and retries once on 401 after a single-flight Supabase session refresh.
 */
export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, signal: externalSignal, ...fetchOptions } = options;
  const accessToken = await getValidAccessToken();

  let response = await executeFetchWithToken(
    path,
    fetchOptions,
    accessToken,
    timeoutMs,
    externalSignal,
  );

  if (response.status === 401) {
    const refreshedToken = await refreshAccessTokenSingleFlight();
    response = await executeFetchWithToken(
      path,
      fetchOptions,
      refreshedToken,
      timeoutMs,
      externalSignal,
    );
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    let detail: unknown;

    try {
      const payload = (await response.json()) as { detail?: unknown; message?: unknown };
      detail = payload.detail;
      if (typeof payload.detail === "string" && payload.detail.trim()) {
        message = payload.detail;
      } else if (typeof payload.message === "string" && payload.message.trim()) {
        message = payload.message;
      }
    } catch {
      // Ignore JSON parse failures on non-JSON error responses.
    }

    throw new ApiError(response.status, message, detail);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}
