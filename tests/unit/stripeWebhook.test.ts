/**
 * Stripe Webhook Handler — Unit Tests
 *
 * Tests webhook signature verification and event routing.
 * Uses crypto to generate valid signatures for testing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Mock environment
// ---------------------------------------------------------------------------

const WEBHOOK_SECRET = "whsec_test_secret_key_for_testing";
const originalEnv = { ...process.env };

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_SECRET = WEBHOOK_SECRET;
  process.env.POCKETBASE_URL = "http://localhost:8090";
  process.env.POCKETBASE_ADMIN_EMAIL = "admin@test.com";
  process.env.POCKETBASE_ADMIN_PASSWORD = "testpassword";
});

afterEach(() => {
  process.env = { ...originalEnv };
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function generateSignature(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const signedPayload = `${timestamp}.${payload}`;
  const hmac = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");
  return `t=${timestamp},v1=${hmac}`;
}

function createWebhookRequest(event: object, secret?: string) {
  const payload = JSON.stringify(event);
  const sig = generateSignature(payload, secret || WEBHOOK_SECRET);
  return new Request("http://localhost:3000/api/stripe/webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "stripe-signature": sig,
    },
    body: payload,
  });
}

function makeEvent(type: string, dataObject: object) {
  return {
    id: `evt_test_${Date.now()}`,
    type,
    data: { object: dataObject },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("POST /api/stripe/webhook", () => {
  it("returns 400 when stripe-signature header is missing", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      body: "{}",
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error).toContain("Missing stripe-signature");
  });

  it("returns 401 for invalid signature", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: {
        "stripe-signature": "t=123,v1=invalidsignature00000000000000000000000000000000000000000000",
      },
      body: "{}",
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toContain("Invalid signature");
  });

  it("returns 500 when STRIPE_WEBHOOK_SECRET is not set", async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");
    const req = new Request("http://localhost:3000/api/stripe/webhook", {
      method: "POST",
      headers: { "stripe-signature": "t=123,v1=abc" },
      body: "{}",
    }) as any;

    const res = await POST(req);
    expect(res.status).toBe(500);
    const data = await res.json();
    expect(data.error).toContain("not configured");
  });

  it("returns 200 for valid checkout.session.completed event", async () => {
    // Mock fetch for PocketBase admin auth + user update
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "pb_admin_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
      });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const event = makeEvent("checkout.session.completed", {
      client_reference_id: "user123",
      subscription: "sub_test",
      customer: "cus_test",
      metadata: { userId: "user123", plan: "monthly" },
    });

    const req = createWebhookRequest(event) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 for valid customer.subscription.updated event", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "pb_admin_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
      });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const event = makeEvent("customer.subscription.updated", {
      id: "sub_test",
      customer: "cus_test",
      status: "active",
      metadata: { userId: "user123", plan: "yearly" },
      current_period_end: Math.floor(Date.now() / 1000) + 86400 * 30,
      items: {
        data: [{ price: { id: "price_yearly", recurring: { interval: "year" } } }],
      },
    });

    const req = createWebhookRequest(event) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 for unhandled event types", async () => {
    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const event = makeEvent("some.unknown.event", { id: "test" });
    const req = createWebhookRequest(event) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });

  it("returns 200 for customer.subscription.deleted event", async () => {
    const mockFetch = vi.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ token: "pb_admin_token" }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
        text: async () => "",
      });
    vi.stubGlobal("fetch", mockFetch);

    vi.resetModules();
    const { POST } = await import("@/app/api/stripe/webhook/route");

    const event = makeEvent("customer.subscription.deleted", {
      id: "sub_test",
      customer: "cus_test",
      status: "canceled",
      metadata: { userId: "user123" },
      items: {
        data: [{ price: { id: "price_monthly", recurring: { interval: "month" } } }],
      },
    });

    const req = createWebhookRequest(event) as any;
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.received).toBe(true);
  });
});
