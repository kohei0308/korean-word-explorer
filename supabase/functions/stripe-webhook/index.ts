import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.4";
import Stripe from "npm:stripe@17.7.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractSubscriptionId(
  value: string | Stripe.Subscription | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) return value.id;
  return null;
}

function extractCustomerId(
  value: string | Stripe.Customer | Stripe.DeletedCustomer | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (typeof value === "object" && "id" in value) return value.id;
  return null;
}

function maskEmail(email: string): string {
  return email.replace(/^(.{2}).*@/, "$1***@");
}

async function resolveUserId(
  supabase: ReturnType<typeof createClient>,
  metadata: Record<string, string> | null | undefined,
  customerEmail: string | null | undefined,
): Promise<string | null> {
  const fromMeta = metadata?.supabase_user_id;
  if (fromMeta) return fromMeta;

  if (customerEmail) {
    console.log(
      `[stripe-webhook] No user_id in metadata, falling back to email lookup: ${maskEmail(customerEmail)}`,
    );
    const { data: users, error } = await supabase.auth.admin.listUsers();
    if (error) {
      console.error("[stripe-webhook] listUsers error:", error);
      return null;
    }
    const match = users.users.find(
      (u) => u.email?.toLowerCase() === customerEmail.toLowerCase(),
    );
    if (match) {
      console.log(`[stripe-webhook] Found user by email: ${maskEmail(customerEmail)}`);
      return match.id;
    }
    console.warn(
      `[stripe-webhook] No user found for email: ${maskEmail(customerEmail)}`,
    );
  }

  return null;
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
  console.log("[stripe-webhook] Upserting subscription:", {
    userId,
    customerId,
    subscriptionId,
    status,
    currentPeriodEnd: currentPeriodEnd.toISOString(),
    planInterval,
  });

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
    console.error("[stripe-webhook] Subscription upsert error:", error);
  } else {
    console.log("[stripe-webhook] Subscription upserted successfully");
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

const cryptoProvider = Stripe.createSubtleCryptoProvider();

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!stripeKey || !supabaseUrl || !serviceKey) {
      console.error("[stripe-webhook] Missing env vars");
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-12-18.acacia" });
    const supabase = createClient(supabaseUrl, serviceKey);

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      console.error("[stripe-webhook] STRIPE_WEBHOOK_SECRET is not set");
      return jsonResponse({ error: "Server configuration error." }, 500);
    }

    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      console.error("[stripe-webhook] Missing stripe-signature header");
      return jsonResponse({ error: "Missing signature." }, 400);
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(
        body,
        signature,
        webhookSecret,
        undefined,
        cryptoProvider,
      );
    } catch (err) {
      console.error("[stripe-webhook] Signature verification failed:", err);
      return jsonResponse({ error: "Invalid signature." }, 400);
    }

    console.log(`[stripe-webhook] Processing event: ${event.type} (${event.id})`);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = extractSubscriptionId(session.subscription);
        const customerId = extractCustomerId(session.customer);

        console.log("[stripe-webhook] checkout.session.completed:", {
          sessionId: session.id,
          subscriptionId,
          customerId,
          metadata: session.metadata,
          customerEmail: session.customer_email || session.customer_details?.email,
        });

        if (!subscriptionId) {
          console.warn("[stripe-webhook] No subscription ID in session, skipping");
          break;
        }

        const subscription =
          await stripe.subscriptions.retrieve(subscriptionId);

        const userId = await resolveUserId(
          supabase,
          session.metadata,
          session.customer_email ||
            session.customer_details?.email,
        );

        if (!userId) {
          console.error(
            "[stripe-webhook] Could not resolve user ID for session:",
            session.id,
          );
          break;
        }

        if (subscription.metadata && !subscription.metadata.supabase_user_id) {
          await stripe.subscriptions.update(subscriptionId, {
            metadata: {
              ...subscription.metadata,
              supabase_user_id: userId,
            },
          });
        }

        const planInterval = session.metadata?.plan_interval ||
          detectPlanInterval(subscription);

        await upsertSubscription(
          supabase,
          userId,
          customerId || (subscription.customer as string),
          subscriptionId,
          subscription.status,
          new Date(subscription.current_period_end * 1000),
          planInterval,
        );
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = extractCustomerId(subscription.customer);

        const userId = await resolveUserId(
          supabase,
          subscription.metadata,
          null,
        );

        if (!userId && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !("deleted" in customer && customer.deleted)) {
            const resolved = await resolveUserId(
              supabase,
              null,
              customer.email,
            );
            if (resolved) {
              const planInterval = detectPlanInterval(subscription);
              await upsertSubscription(
                supabase,
                resolved,
                customerId,
                subscription.id,
                subscription.status,
                new Date(subscription.current_period_end * 1000),
                planInterval,
              );
            }
          }
          break;
        }

        if (userId) {
          const planInterval = detectPlanInterval(subscription);
          await upsertSubscription(
            supabase,
            userId,
            customerId || "",
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
        const customerId = extractCustomerId(subscription.customer);

        const userId = await resolveUserId(
          supabase,
          subscription.metadata,
          null,
        );

        if (!userId && customerId) {
          const customer = await stripe.customers.retrieve(customerId);
          if (customer && !("deleted" in customer && customer.deleted)) {
            const resolved = await resolveUserId(
              supabase,
              null,
              customer.email,
            );
            if (resolved) {
              const planInterval = detectPlanInterval(subscription);
              await upsertSubscription(
                supabase,
                resolved,
                customerId,
                subscription.id,
                "canceled",
                new Date(subscription.current_period_end * 1000),
                planInterval,
              );
            }
          }
          break;
        }

        if (userId) {
          const planInterval = detectPlanInterval(subscription);
          await upsertSubscription(
            supabase,
            userId,
            customerId || "",
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
        const subscriptionId = extractSubscriptionId(invoice.subscription);

        if (subscriptionId) {
          const subscription =
            await stripe.subscriptions.retrieve(subscriptionId);
          const customerId = extractCustomerId(subscription.customer);

          let userId = await resolveUserId(
            supabase,
            subscription.metadata,
            null,
          );

          if (!userId && customerId) {
            const customer = await stripe.customers.retrieve(customerId);
            if (customer && !("deleted" in customer && customer.deleted)) {
              userId = await resolveUserId(supabase, null, customer.email);
            }
          }

          if (userId) {
            const planInterval = detectPlanInterval(subscription);
            await upsertSubscription(
              supabase,
              userId,
              customerId || "",
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
        console.log(`[stripe-webhook] Unhandled event type: ${event.type}`);
    }

    return jsonResponse({ received: true });
  } catch (err) {
    console.error("[stripe-webhook] Webhook handler error:", err);
    return jsonResponse({ error: "Webhook processing failed." }, 500);
  }
});
