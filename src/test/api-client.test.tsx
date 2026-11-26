import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiFetch } from "@/lib/api/client";

const mockGetSession = vi.fn();
const mockRefreshSession = vi.fn();

vi.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
      refreshSession: () => mockRefreshSession(),
    },
  },
}));

describe("apiFetch timeout and auth header behavior", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          access_token: "test-jwt-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    });
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
  });

  it("attaches Authorization Bearer header and returns parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock;

    const result = await apiFetch<{ ok: boolean }>("/api/v1/tickets");
    expect(result).toEqual({ ok: true });

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Headers;
    expect(headers.get("Authorization")).toBe("Bearer test-jwt-token");
  });

  it("aborts and throws ApiError(408) when request exceeds timeoutMs", async () => {
    vi.useFakeTimers();

    globalThis.fetch = vi.fn((_url, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener("abort", () => {
          const abortErr = new Error("Aborted");
          abortErr.name = "AbortError";
          reject(abortErr);
        });
      });
    });

    const promise = apiFetch("/api/v1/tickets/123/analyze", {
      method: "POST",
      timeoutMs: 50,
    });

    const assertion = expect(promise).rejects.toMatchObject({
      name: "ApiError",
      status: 408,
    } satisfies Partial<ApiError>);

    await vi.advanceTimersByTimeAsync(60);
    await assertion;
  });

  it("refreshes session on 401 and retries POST request once preserving body and headers", async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: "refreshed-jwt-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Invalid or expired authentication token" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: "msg-1", message: "hello" }), {
          status: 201,
          headers: { "Content-Type": "application/json" },
        }),
      );
    globalThis.fetch = fetchMock;

    const result = await apiFetch<{ id: string }>("/api/v1/tickets/123/messages", {
      method: "POST",
      headers: { "X-Custom": "keep-me" },
      body: JSON.stringify({ message: "hello" }),
    });

    expect(result).toEqual({ id: "msg-1", message: "hello" });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const [, retryInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    const retryHeaders = retryInit.headers as Headers;
    expect(retryInit.method).toBe("POST");
    expect(retryInit.body).toBe(JSON.stringify({ message: "hello" }));
    expect(retryHeaders.get("X-Custom")).toBe("keep-me");
    expect(retryHeaders.get("Authorization")).toBe("Bearer refreshed-jwt-token");
  });

  it("does not retry when session refresh fails on 401", async () => {
    mockRefreshSession.mockResolvedValue({
      data: { session: null },
      error: new Error("Refresh token expired"),
    });

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ detail: "Invalid or expired authentication token" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      }),
    );
    globalThis.fetch = fetchMock;

    await expect(apiFetch("/api/v1/tickets")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Your session has expired. Please sign in again.",
    } satisfies Partial<ApiError>);

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("stops after one retry if the retried request also returns 401", async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: "refreshed-jwt-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    });

    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ detail: "Unauthorized role" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock;

    await expect(apiFetch("/api/v1/tickets")).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      message: "Unauthorized role",
    } satisfies Partial<ApiError>);

    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("shares a single refreshSession call across concurrent 401 responses", async () => {
    mockRefreshSession.mockResolvedValue({
      data: {
        session: {
          access_token: "shared-refreshed-token",
          expires_at: Math.floor(Date.now() / 1000) + 3600,
        },
      },
      error: null,
    });

    const fetchMock = vi.fn().mockImplementation((_url: string, init?: RequestInit) => {
      const auth = (init?.headers as Headers).get("Authorization");
      if (auth === "Bearer test-jwt-token") {
        return Promise.resolve(
          new Response(JSON.stringify({ detail: "Expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" },
          }),
        );
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    globalThis.fetch = fetchMock;

    const [r1, r2] = await Promise.all([
      apiFetch<{ ok: boolean }>("/api/v1/tickets/1"),
      apiFetch<{ ok: boolean }>("/api/v1/tickets/1/messages"),
    ]);

    expect(r1).toEqual({ ok: true });
    expect(r2).toEqual({ ok: true });
    expect(mockRefreshSession).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });
});
