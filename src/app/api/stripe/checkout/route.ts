/**
 * ForageFlow — Stripe Checkout Session API Route
 *
 * Server-side only. Creates a Stripe Checkout session for monthly or yearly plans.
 * The STRIPE_SECRET_KEY is never exposed to the frontend.
 *
 * POST /api/stripe/checkout
 * Body: { plan: "monthly" | "yearly", userId: string }
 * Returns: { url: string } — the Stripe Checkout URL to redirect the user to.
 */

import { NextRequest, NextResponse } from "next/server";

// ---------------------------------------------------------------------------
// Price IDs — these map to Stripe Price objects configured in the dashboard.
// In production, these should come from env vars. Using placeholders here
// that can be overridden via STRIPE_MONTHLY_PRICE_ID / STRIPE_YEARLY_PRICE_ID.
// ---------------------------------------------------------------------------

const PRICE_IDS: Record<string, string> = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || "price_monthly_placeholder",
  yearly: process.env.STRIPE_YEARLY_PRICE_ID || "price_yearly_placeholder",
};

const ALLOWED_PLANS = ["monthly", "yearly"] as const;
type CheckoutPlan = (typeof ALLOWED_PLANS)[number];

function isValidPlan(plan: unknown): plan is CheckoutPlan {
  return typeof plan === "string" && ALLOWED_PLANS.includes(plan as CheckoutPlan);
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Validate Stripe secret key is configured
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    console.error("[stripe/checkout] STRIPE_SECRET_KEY is not configured");
    return NextResponse.json(
      { error: "Stripe is not configured on this server." },
      { status: 500 },
    );
  }

  // Parse and validate request body
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body." },
      { status: 400 },
    );
  }

  const { plan, userId } = body;

  if (!isValidPlan(plan)) {
    return NextResponse.json(
      { error: "Invalid plan. Must be 'monthly' or 'yearly'." },
      { status: 400 },
    );
  }

  if (!userId || typeof userId !== "string" || userId.trim().length === 0) {
    return NextResponse.json(
      { error: "userId is required." },
      { status: 400 },
    );
  }

  const priceId = PRICE_IDS[plan];
  if (!priceId) {
    return NextResponse.json(
      { error: "Price not configured for this plan." },
      { status: 500 },
    );
  }

  // Build the success/cancel URLs
  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const successUrl = `${origin}/membership?session_id={CHECKOUT_SESSION_ID}&status=success`;
  const cancelUrl = `${origin}/membership?status=canceled`;

  try {
    // Use the Stripe API directly via fetch to avoid requiring the stripe npm package.
    // This keeps the dependency footprint minimal.
    const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        "mode": "subscription",
        "payment_method_types[0]": "card",
        "line_items[0][price]": priceId,
        "line_items[0][quantity]": "1",
        "success_url": successUrl,
        "cancel_url": cancelUrl,
        "client_reference_id": userId.trim(),
        "metadata[userId]": userId.trim(),
        "metadata[plan]": plan,
      }).toString(),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("[stripe/checkout] Stripe API error:", errorData);
      return NextResponse.json(
        { error: "Failed to create checkout session." },
        { status: 502 },
      );
    }

    const session = await response.json();

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[stripe/checkout] Unexpected error:", err);
    return NextResponse.json(
      { error: "Internal server error." },
      { status: 500 },
    );
  }
}
