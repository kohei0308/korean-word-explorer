import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

function getAllowedOrigin(req: Request): string {
  const allowedRaw = Deno.env.get("ALLOWED_ORIGINS") || "";
  const allowedList = allowedRaw.split(",").map((o) => o.trim()).filter(Boolean);
  const origin = req.headers.get("Origin") || "";
  if (allowedList.includes(origin)) return origin;
  return allowedList[0] || "";
}

function corsHeaders(req: Request) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(req),
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Client-Info, Apikey",
  };
}

function jsonResponse(req: Request, data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

const PLANS = {
  month: {
    currency: "jpy",
    unitAmount: 980,
    interval: "month" as const,
    name: "Premium Plan (Monthly)",
    description: "Unlimited word lookups, culture notes, and related words",
  },
  year: {
    currency: "jpy",
    unitAmount: 7800,
    interval: "year" as const,
    name: "Premium Plan (Yearly)",
    description:
      "Unlimited word lookups, culture notes, and related words - Save 33%",
  },
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders(req) });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse(req, { error: "Server configuration error." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(req, { error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse(req, { error: "Invalid authentication." }, 401);
    }

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      // body is optional
    }

    const interval =
      body.interval === "year" || body.interval === "month"
        ? body.interval
        : "month";
    const plan = PLANS[interval];

    const appUrl = Deno.env.get("APP_URL") || getAllowedOrigin(req) || supabaseUrl;
    const successUrl = `${appUrl}?checkout=success`;
    const cancelUrl = `${appUrl}?checkout=cancel`;

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data: existingSub } = await supabase
      .from("subscriptions")
      .select("stripe_customer_id, status")
      .eq("user_id", user.id)
      .maybeSingle();

    let customerId = existingSub?.stripe_customer_id;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [
        {
          price_data: {
            currency: plan.currency,
            unit_amount: plan.unitAmount,
            recurring: { interval: plan.interval },
            product_data: {
              name: plan.name,
              description: plan.description,
            },
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        metadata: {
          supabase_user_id: user.id,
          plan_interval: interval,
        },
      },
      metadata: {
        supabase_user_id: user.id,
        plan_interval: interval,
      },
    });

    return jsonResponse(req, { url: session.url });
  } catch (err) {
    console.error("Checkout session error:", err);
    return jsonResponse(req, 
      { error: "Failed to create checkout session." },
      500,
    );
  }
});
