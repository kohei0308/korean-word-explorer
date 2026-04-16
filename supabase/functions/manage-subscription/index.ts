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

    const body = await req.json();
    const action = body.action;

    const supabase = createClient(supabaseUrl, serviceKey);
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("stripe_subscription_id, status, plan_interval")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!sub || !sub.stripe_subscription_id) {
      return jsonResponse(req, { error: "No active subscription found." }, 404);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    if (action === "cancel") {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return jsonResponse(req, { success: true });
    }

    if (action === "change_interval") {
      const newInterval = body.interval;
      if (newInterval !== "month" && newInterval !== "year") {
        return jsonResponse(req, { error: "Invalid interval." }, 400);
      }

      if (newInterval === sub.plan_interval) {
        return jsonResponse(req, { error: "Already on this interval." }, 400);
      }

      const subscription = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id,
      );
      const currentItem = subscription.items.data[0];

      if (!currentItem) {
        return jsonResponse(req, { error: "No subscription item found." }, 400);
      }

      const PLANS = {
        month: { currency: "jpy", unitAmount: 980, interval: "month" as const },
        year: { currency: "jpy", unitAmount: 7800, interval: "year" as const },
      };

      const plan = PLANS[newInterval];

      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: false,
        items: [
          {
            id: currentItem.id,
            price_data: {
              currency: plan.currency,
              unit_amount: plan.unitAmount,
              recurring: { interval: plan.interval },
              product: currentItem.price.product as string,
            },
          },
        ],
        metadata: {
          ...subscription.metadata,
          plan_interval: newInterval,
        },
        proration_behavior: "create_prorations",
      });

      await supabase
        .from("subscriptions")
        .update({
          plan_interval: newInterval,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      return jsonResponse(req, { success: true });
    }

    return jsonResponse(req, { error: "Invalid action." }, 400);
  } catch (err) {
    console.error("Manage subscription error:", err);
    return jsonResponse(req, { error: "Failed to manage subscription." }, 500);
  }
});
