/**
 * ForageWise — Stripe Webhook Handler
 *
 * Server-side only. Verifies webhook signatures and processes Stripe events
 * to update user membership in PocketBase.
 *
 * POST /api/stripe/webhook
 *
 * Handled events:
 * - checkout.session.completed
 * - customer.subscription.created
 * - customer.subscription.updated
 * - customer.subscription.deleted
 * - invoice.payment_succeeded
 * - invoice.payment_failed
 *
 * STRIPE_WEBHOOK_SECRET must be set in environment variables.
 * STRIPE_SECRET_KEY must be set for Stripe API calls.
 * POCKETBASE_URL must be set for PocketBase API calls.
 * POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD for admin auth.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StripeEvent {
  id: string;
  type: string;
  data: {
    object: Record<string, unknown>;
  };
}

interface SubscriptionObject {
  id: string;
  customer: string;
  status: string;
  metadata?: Record<string, string>;
  current_period_end?: number;
  items?: {
    data?: Array<{
      price?: {
        id?: string;
        recurring?: { interval?: string };
      };
    }>;
  };
}

// ---------------------------------------------------------------------------
// Webhook signature verification
// ---------------------------------------------------------------------------

function verifyStripeSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  try {
    const parts = signature.split(",");
    const timestampPart = parts.find((p) => p.startsWith("t="));
    const sigPart = parts.find((p) => p.startsWith("v1="));

    if (!timestampPart || !sigPart) return false;

    const timestamp = timestampPart.slice(2);
    const expectedSig = sigPart.slice(3);

    // Verify timestamp is within 5 minutes
    const now = Math.floor(Date.now() / 1000);
    const ts = parseInt(timestamp, 10);
    if (Math.abs(now - ts) > 300) return false;

    // Compute expected signature
    const signedPayload = `${timestamp}.${payload}`;
    const hmac = crypto
      .createHmac("sha256", secret)
      .update(signedPayload)
      .digest("hex");

    // Constant-time comparison
    return crypto.timingSafeEqual(
      Buffer.from(hmac, "hex"),
      Buffer.from(expectedSig, "hex"),
    );
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// PocketBase helpers
// ---------------------------------------------------------------------------

let pbAdminToken: string | null = null;
let pbTokenExpiry = 0;

async function getPocketBaseAdminToken(): Promise<string | null> {
  const pbUrl = process.env.POCKETBASE_URL;
  const email = process.env.POCKETBASE_ADMIN_EMAIL;
  const password = process.env.POCKETBASE_ADMIN_PASSWORD;

  if (!pbUrl || !email || !password) {
    console.error("[stripe/webhook] PocketBase admin credentials not configured");
    return null;
  }

  // Reuse token if still valid (with 60s buffer)
  if (pbAdminToken && Date.now() < pbTokenExpiry - 60_000) {
    return pbAdminToken;
  }

  try {
    const res = await fetch(`${pbUrl}/api/admins/auth-with-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identity: email, password }),
    });

    if (!res.ok) {
      console.error("[stripe/webhook] PocketBase admin auth failed:", res.status);
      return null;
    }

    const data = await res.json();
    pbAdminToken = data.token;
    // PocketBase tokens are valid for ~2 hours by default
    pbTokenExpiry = Date.now() + 2 * 60 * 60 * 1000;
    return pbAdminToken;
  } catch (err) {
    console.error("[stripe/webhook] PocketBase admin auth error:", err);
    return null;
  }
}

async function updateUserMembership(
  userId: string,
  fields: Record<string, unknown>,
): Promise<boolean> {
  const pbUrl = process.env.POCKETBASE_URL;
  if (!pbUrl) return false;

  const token = await getPocketBaseAdminToken();
  if (!token) return false;

  try {
    const res = await fetch(`${pbUrl}/api/collections/users/records/${userId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(fields),
    });

    if (!res.ok) {
      console.error("[stripe/webhook] Failed to update user:", res.status, await res.text());
      return false;
    }

    return true;
  } catch (err) {
    console.error("[stripe/webhook] PocketBase update error:", err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Plan detection from Stripe price/interval
// ---------------------------------------------------------------------------

function detectPlan(subscription: SubscriptionObject): string {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval;
  if (interval === "year") return "yearly";
  if (interval === "month") return "monthly";
  // Fall back to metadata
  return subscription.metadata?.plan || "monthly";
}

function mapStripeStatus(stripeStatus: string): string {
  switch (stripeStatus) {
    case "active": return "active";
    case "trialing": return "trialing";
    case "past_due": return "past_due";
    case "canceled":
    case "unpaid":
    case "incomplete_expired":
      return "canceled";
    default: return "inactive";
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutCompleted(session: Record<string, unknown>): Promise<void> {
  const userId = (session.client_reference_id as string) || (session.metadata as Record<string, string>)?.userId;
  const subscriptionId = session.subscription as string;
  const customerId = session.customer as string;
  const plan = (session.metadata as Record<string, string>)?.plan || "monthly";

  if (!userId) {
    console.error("[stripe/webhook] checkout.session.completed: no userId found");
    return;
  }

  await updateUserMembership(userId, {
    membershipPlan: plan,
    membershipStatus: "active",
    stripeCustomerId: customerId,
    subscriptionId: subscriptionId,
    role: "member",
    membershipLastVerifiedAt: new Date().toISOString(),
  });
}

async function handleSubscriptionEvent(subscription: SubscriptionObject): Promise<void> {
  const userId = subscription.metadata?.userId;
  if (!userId) {
    console.warn("[stripe/webhook] subscription event: no userId in metadata");
    return;
  }

  const plan = detectPlan(subscription);
  const status = mapStripeStatus(subscription.status);
  const periodEnd = subscription.current_period_end
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : undefined;

  const fields: Record<string, unknown> = {
    membershipPlan: status === "canceled" ? "free" : plan,
    membershipStatus: status,
    subscriptionId: subscription.id,
    membershipLastVerifiedAt: new Date().toISOString(),
  };

  if (periodEnd) {
    fields.currentPeriodEnd = periodEnd;
  }

  // Downgrade role if canceled
  if (status === "canceled") {
    fields.role = "free";
  } else if (status === "active" || status === "trialing") {
    fields.role = "member";
  }

  await updateUserMembership(userId, fields);
}

async function handleInvoicePaymentSucceeded(invoice: Record<string, unknown>): Promise<void> {
  const subscriptionId = invoice.subscription as string;
  const metadata = invoice.subscription_details as Record<string, unknown>;
  const userId = (metadata?.metadata as Record<string, string>)?.userId;

  if (!userId) {
    // Try lines metadata
    console.warn("[stripe/webhook] invoice.payment_succeeded: no userId, skipping membership update");
    return;
  }

  await updateUserMembership(userId, {
    membershipStatus: "active",
    membershipLastVerifiedAt: new Date().toISOString(),
  });
}

async function handleInvoicePaymentFailed(invoice: Record<string, unknown>): Promise<void> {
  const metadata = invoice.subscription_details as Record<string, unknown>;
  const userId = (metadata?.metadata as Record<string, string>)?.userId;

  if (!userId) {
    console.warn("[stripe/webhook] invoice.payment_failed: no userId, skipping");
    return;
  }

  await updateUserMembership(userId, {
    membershipStatus: "past_due",
    membershipLastVerifiedAt: new Date().toISOString(),
  });
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json(
      { error: "Webhook secret not configured." },
      { status: 500 },
    );
  }

  // Read raw body for signature verification
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header." },
      { status: 400 },
    );
  }

  // Verify signature
  if (!verifyStripeSignature(rawBody, signature, webhookSecret)) {
    console.error("[stripe/webhook] Invalid signature");
    return NextResponse.json(
      { error: "Invalid signature." },
      { status: 401 },
    );
  }

  // Parse event
  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON payload." },
      { status: 400 },
    );
  }

  // Route event to handler
  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        await handleSubscriptionEvent(event.data.object as unknown as SubscriptionObject);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      default:
        // Unhandled event type — acknowledge receipt
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error(`[stripe/webhook] Error handling ${event.type}:`, err);
    // Still return 200 to prevent Stripe from retrying
    return NextResponse.json({ received: true, error: "Handler error" }, { status: 200 });
  }

  return NextResponse.json({ received: true });
}
