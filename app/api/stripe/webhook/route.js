const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const { createClient } = require("@supabase/supabase-js");

/* =========================
   ENV VALIDATION
========================= */

const required = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(
      `Missing environment variable: ${key}`
    );
  }
}

/* =========================
   STRIPE
========================= */

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY,
  {
    apiVersion: "2024-06-20",
  }
);

/* =========================
   SUPABASE
========================= */

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* =========================
   HANDLE EVENTS
========================= */

async function handleCheckoutCompleted(
  session
) {
  const leadId =
    session.metadata?.leadId;

  const plan =
    session.metadata?.plan;

  if (!leadId || !plan) {
    throw new Error(
      "Missing metadata"
    );
  }

  const stripeCustomerId =
    session.customer || null;

  const customerEmail =
    session.customer_details
      ?.email || null;

  const amount =
    (session.amount_total || 0) /
    100;

  /* =========================
     UPDATE LEAD
  ========================= */

  const {
    error: leadError,
  } = await supabase
    .from("leads")
    .update({
      paid: true,
      status: "paid",
      plan,
      customer_email:
        customerEmail,
      stripe_customer_id:
        stripeCustomerId,
      updated_at:
        new Date().toISOString(),
    })
    .eq("id", leadId.trim());

  if (leadError) {
    throw leadError;
  }

  /* =========================
     SAVE PAYMENT
  ========================= */

  const {
    error: paymentError,
  } = await supabase
    .from("payments")
    .upsert(
      {
        id: session.id,

        lead_id: leadId,

        stripe_customer_id:
          stripeCustomerId,

        customer_email:
          customerEmail,

        amount,

        currency:
          session.currency ||
          "usd",

        status: "paid",

        created_at:
          new Date().toISOString(),
      },
      {
        onConflict: "id",
      }
    );

  if (paymentError) {
    throw paymentError;
  }
}

/* =========================
   MAIN HANDLER
========================= */

async function processEvent(event) {
  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(
        event.data.object
      );
      break;

    default:
      console.log(
        `Unhandled event: ${event.type}`
      );
  }
}

/* =========================
   WEBHOOK ROUTE
========================= */

router.post(
  "/",

  express.raw({
    type: "application/json",
  }),

  async (req, res) => {
    let event;

    try {
      const signature =
        req.headers[
          "stripe-signature"
        ];

      if (!signature) {
        return res
          .status(400)
          .json({
            error:
              "Missing Stripe signature",
          });
      }

      /* =========================
         VERIFY STRIPE EVENT
      ========================= */

      event =
        stripe.webhooks.constructEvent(
          req.body,
          signature,
          process.env
            .STRIPE_WEBHOOK_SECRET
        );

      console.log(
        `Received Stripe event: ${event.type}`
      );

      /* =========================
         IDEMPOTENCY CHECK
      ========================= */

      const {
        data: existingEvent,
      } = await supabase
        .from("stripe_events")
        .select("status")
        .eq("id", event.id)
        .single();

      if (
        existingEvent?.status ===
        "completed"
      ) {
        console.log(
          `Skipping duplicate event: ${event.id}`
        );

        return res.json({
          received: true,
          duplicate: true,
        });
      }

      /* =========================
         SAVE PROCESSING EVENT
      ========================= */

      await supabase
        .from("stripe_events")
        .upsert({
          id: event.id,

          type: event.type,

          status: "processing",

          created_at:
            new Date().toISOString(),
        });

      /* =========================
         PROCESS EVENT
      ========================= */

      await processEvent(event);

      /* =========================
         MARK COMPLETED
      ========================= */

      await supabase
        .from("stripe_events")
        .update({
          status: "completed",

          processed_at:
            new Date().toISOString(),
        })
        .eq("id", event.id);

      console.log(
        `Processed event: ${event.id}`
      );

      return res.json({
        received: true,
      });

    } catch (err) {
      console.error(
        "Webhook Error:",
        err
      );

      /* =========================
         MARK FAILED
      ========================= */

      if (event?.id) {
        await supabase
          .from("stripe_events")
          .update({
            status: "failed",

            error:
              err.message,

            failed_at:
              new Date().toISOString(),
          })
          .eq("id", event.id);
      }

      return res
        .status(500)
        .json({
          success: false,
          error:
            err.message ||
            "Webhook failed",
        });
    }
  }
);

module.exports = router;