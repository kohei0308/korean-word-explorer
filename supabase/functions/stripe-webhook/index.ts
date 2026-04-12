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

async function upsertSubscription(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  customerId: string,
  subscriptionId: string,
  status: string,
  currentPeriodEnd: Date,
  planInterval: string,
) {
  const { error } = await supabase
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        status,
        current_period_end: currentPeriodEnd.toISOString(),
        plan_interval: planInterval,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" },
    );

  if (error) {
    console.error("Subscription upsert error:", error);
  }
}

function detectPlanInterval(subscription: Stripe.Subscription): string {
  const metaInterval = subscription.metadata?.plan_interval;
  if (metaInterval === "month" || metaInterval === "year") {
    return metaInterval;
  }
  const item = subscription.items?.data?.[0];
  if (item?.price?.recurring?.interval === "year") {
    return "year";
  }
  return "month";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !serviceKey) {
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    let event: Stripe.Event;

    if (signature) {
      const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
      if (webhookSecret) {
        try {
          event = await stripe.webhooks.constructEventAsync(
            body,
            signature,
            webhookSecret,
          );
        } catch (err) {
          console.error("Webhook signature verification failed:", err);
          return jsonResponse({ error: "Invalid signature." }, 400);
        }
      } else {
        event = JSON.parse(body) as Stripe.Event;
      }
    } else {
      event = JSON.parse(body) as Stripe.Event;
    }

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.supabase_user_id;
        const subscriptionId = session.subscription as string;

        if (userId && subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const planInterval = session.metadata?.plan_interval ||
            detectPlanInterval(subscription);
          await upsertSubscription(
            supabase,
            userId,
            session.customer as string,
            subscriptionId,
            subscription.status,
            new Date(subscription.current_period_end * 1000),
            planInterval,
          );
        }
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const planInterval = detectPlanInterval(subscription);
          await upsertSubscription(
            supabase,
            userId,
            subscription.customer as string,
            subscription.id,
            subscription.status,
            new Date(subscription.current_period_end * 1000),
            planInterval,
          );
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const userId = subscription.metadata?.supabase_user_id;

        if (userId) {
          const planInterval = detectPlanInterval(subscription);
          await upsertSubscription(
            supabase,
            userId,
            subscription.customer as string,
            subscription.id,
            "canceled",
            new Date(subscription.current_period_end * 1000),
            planInterval,
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;

        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const userId = subscription.metadata?.supabase_user_id;

          if (userId) {
            const planInterval = detectPlanInterval(subscription);
            await upsertSubscription(
              supabase,
              userId,
              subscription.customer as string,
              subscriptionId,
              "past_due",
              new Date(subscription.current_period_end * 1000),
              planInterval,
            );
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return jsonResponse({ error: "Webhook processing failed." }, 500);
  }
});
