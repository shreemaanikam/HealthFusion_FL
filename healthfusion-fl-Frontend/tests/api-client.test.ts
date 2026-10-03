import { describe, it, expect, vi, afterEach } from "vitest";
import { apiFetch, apiFetchOrNull, ApiError } from "@/services/api/client";

function mockFetch(status: number, body: unknown) {
  const fn = vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fn);
  return fn;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("apiFetch", () => {
  it("sends Authorization header with Bearer token when sessionStorage has a token", async () => {
    // Simulate a stored JWT
    const fakeToken = "test.jwt.token";
    vi.stubGlobal("sessionStorage", {
      getItem: (key: string) => (key === "healthfusion.live.token" ? fakeToken : null),
      setItem: () => {},
      removeItem: () => {},
    });
    const fn = mockFetch(200, {});
    await apiFetch("/api/anything");
    const sentHeaders = fn.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(sentHeaders?.["Authorization"]).toBe(`Bearer ${fakeToken}`);
    // Must NOT send credentials:include (that's the old cookie model)
    expect(fn.mock.calls[0]?.[1]).not.toMatchObject({ credentials: "include" });
  });

  it("sends no Authorization header when no token is stored", async () => {
    vi.stubGlobal("sessionStorage", {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    });
    const fn = mockFetch(200, {});
    await apiFetch("/api/anything");
    const sentHeaders = fn.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(sentHeaders?.["Authorization"]).toBeUndefined();
  });

  it("normalizes snake_case responses to camelCase", async () => {
    mockFetch(200, { global_model_version: "v9", current_round: 3 });
    const res = await apiFetch<{ globalModelVersion: string; currentRound: number }>("/api/federated/status");
    expect(res).toEqual({ globalModelVersion: "v9", currentRound: 3 });
  });

  it("throws ApiError carrying the status on a non-2xx response", async () => {
    mockFetch(503, {});
    await expect(apiFetch("/api/prediction")).rejects.toMatchObject({ status: 503 });
    await expect(apiFetch("/api/prediction")).rejects.toBeInstanceOf(ApiError);
  });
});

describe("apiFetchOrNull", () => {
  it("resolves null on 401 -- signed-out is a normal state, not an error", async () => {
    mockFetch(401, {});
    expect(await apiFetchOrNull("/api/users/me")).toBeNull();
  });

  it("still throws on other failures", async () => {
    mockFetch(500, {});
    await expect(apiFetchOrNull("/api/users/me")).rejects.toMatchObject({ status: 500 });
  });

  it("returns the normalized body on success", async () => {
    mockFetch(200, { organization_id: "o1" });
    expect(await apiFetchOrNull("/api/users/me")).toEqual({ organizationId: "o1" });
  });
});
