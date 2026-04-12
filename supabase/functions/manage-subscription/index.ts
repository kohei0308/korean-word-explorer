import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Authentication required." }, 401);
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: authError,
    } = await userClient.auth.getUser();

    if (authError || !user) {
      return jsonResponse({ error: "Invalid authentication." }, 401);
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
      return jsonResponse({ error: "No active subscription found." }, 404);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });

    if (action === "cancel") {
      await stripe.subscriptions.update(sub.stripe_subscription_id, {
        cancel_at_period_end: true,
      });

      return jsonResponse({ success: true });
    }

    if (action === "change_interval") {
      const newInterval = body.interval;
      if (newInterval !== "month" && newInterval !== "year") {
        return jsonResponse({ error: "Invalid interval." }, 400);
      }

      if (newInterval === sub.plan_interval) {
        return jsonResponse({ error: "Already on this interval." }, 400);
      }

      const subscription = await stripe.subscriptions.retrieve(
        sub.stripe_subscription_id,
      );
      const currentItem = subscription.items.data[0];

      if (!currentItem) {
        return jsonResponse({ error: "No subscription item found." }, 400);
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

      return jsonResponse({ success: true });
    }

    return jsonResponse({ error: "Invalid action." }, 400);
  } catch (err) {
    console.error("Manage subscription error:", err);
    return jsonResponse({ error: "Failed to manage subscription." }, 500);
  }
});
