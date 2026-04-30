/**
 * Stripe Checkout API Route — Unit Tests
 *
 * Tests the server-side checkout session creation endpoint.
 * Validates request body parsing, plan validation, and error handling.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Mock environment and fetch
// ---------------------------------------------------------------------------

const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.STRIPE_SECRET_KEY = "sk_test_fake_key";
  process.env.STRIPE_MONTHLY_PRICE_ID = "price_monthly_test";
  process.env.STRIPE_YEARLY_PRICE_ID = "price_yearly_test";
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper to create a NextRequest-like object
// ---------------------------------------------------------------------------

function createRequest(body: unknown, origin = "http://localhost:3000") {
  const bodyStr = JSON.stringify(body);
  return new Request("http://localhost:3000/api/stripe/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: bodyStr,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/stripe/checkout", () => {
  it("returns 400 for invalid JSON body", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = new Request("http://localhost:3000/api/stripe/checkout", {
      method: "POST",
      body: "not json",
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid JSON");
  });

  it("returns 400 for invalid plan", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "invalid", userId: "user123" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid plan");
  });

  it("returns 400 for missing userId", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "monthly" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("userId");
  });

  it("returns 400 for empty userId", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "monthly", userId: "  " }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("userId");
  });

  it("returns 500 when STRIPE_SECRET_KEY is not set", async () => {
    delete process.env.STRIPE_SECRET_KEY;
    // Re-import to pick up env change
    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "monthly", userId: "user123" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("not configured");
  });

  it("returns checkout URL on successful session creation", async () => {
    // Mock global fetch to simulate Stripe API response
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/session_test" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "monthly", userId: "user123" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/session_test");

    // Verify fetch was called with Stripe API
    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.stripe.com/v1/checkout/sessions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk_test_fake_key",
        }),
      }),
    );

    vi.unstubAllGlobals();
  });

  it("returns 502 when Stripe API returns an error", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: "Invalid API key" } }),
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "yearly", userId: "user456" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(502);
    const data = await res.json();
    expect(data.error).toContain("Failed to create checkout session");

    vi.unstubAllGlobals();
  });

  it("accepts yearly plan", async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: "https://checkout.stripe.com/yearly_session" }),
    });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "yearly", userId: "user789" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.url).toBe("https://checkout.stripe.com/yearly_session");

    vi.unstubAllGlobals();
  });

  it("rejects free plan", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "free", userId: "user123" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid plan");
  });

  it("rejects lifetime plan (not a checkout option)", async () => {
    const { POST } = await import("@/app/api/stripe/checkout/route");
    const req = createRequest({ plan: "lifetime", userId: "user123" }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Invalid plan");
  });
});
