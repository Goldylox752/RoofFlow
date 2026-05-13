const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const supabase = require("../lib/supabase");
const stripe = require("../lib/stripe");

const { buildKey } = require("../utils/idempotency");
const { calculateScore, getTier } = require("../utils/scoring");
const { calculatePrice } = require("../services/pricingEngine");

/* ===============================
   ENV CHECK
=============================== */

if (!process.env.CLIENT_URL) {
  throw new Error("Missing CLIENT_URL");
}

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

/* ===============================
   TELEGRAM (NON-BLOCKING LOGGER)
=============================== */

function sendTelegram(message) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;

  fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: TG_CHAT_ID,
      text: message,
      parse_mode: "Markdown",
    }),
  }).catch(() => {});
}

/* ===============================
   HELPERS
=============================== */

const clean = (v) => (typeof v === "string" ? v.trim() : null);

const normalizeEmail = (email) =>
  clean(email)?.toLowerCase() || null;

const sanitizeUTM = (v) =>
  clean(v)?.slice(0, 120) || null;

/* ===============================
   STRIPE CHECKOUT
=============================== */

async function createCheckoutSession({ lead, tier, score, price }) {
  return stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    billing_address_collection: "auto",
    customer_creation: "always",

    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "cad",
          unit_amount: Math.round(Number(price) * 100),
          product_data: {
            name: `NorthSky ${tier} Access`,
            description: "AI SaaS automation system",
          },
        },
      },
    ],

    metadata: {
      leadId: lead.id,
      tier,
      score: String(score),
      email: lead.email || "",
    },

    success_url: `${process.env.CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/cancel`,

    expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
  });
}

/* ===============================
   ROUTE HANDLER
=============================== */

router.post("/", async (req, res) => {
  const startTime = Date.now();

  try {
    let {
      name,
      email,
      phone,
      city,
      utm_source,
      utm_campaign,
      utm_medium,
    } = req.body || {};

    /* ---------- normalize input ---------- */
    name = clean(name);
    email = normalizeEmail(email);
    phone = clean(phone);
    city = clean(city);

    utm_source = sanitizeUTM(utm_source);
    utm_campaign = sanitizeUTM(utm_campaign);
    utm_medium = sanitizeUTM(utm_medium);

    /* ---------- validation ---------- */
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "Email or phone required",
      });
    }

    /* ---------- idempotency ---------- */
    const idempotencyKey = buildKey(email, phone, city);

    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existing) {
      return res.json({
        success: true,
        duplicate: true,
        lead: existing,
      });
    }

    /* ---------- scoring ---------- */
    const score = calculateScore({ email, phone, city });
    const tier = getTier(score);
    const price = calculatePrice(score, city);

    /* ---------- request metadata ---------- */
    const ip =
      (req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim() || req.ip;

    /* ---------- create lead payload ---------- */
    const leadId = crypto.randomUUID();

    const leadPayload = {
      id: leadId,

      name,
      email,
      phone,
      city,

      status: "new",

      score,
      tier,
      price,

      idempotency_key: idempotencyKey,

      utm_source,
      utm_campaign,
      utm_medium,

      source: req.headers.origin || "direct",
      ip_address: ip,
      user_agent: req.headers["user-agent"],

      created_at: new Date().toISOString(),
    };

    /* ---------- insert lead ---------- */
    const { data: lead, error } = await supabase
      .from("leads")
      .insert([leadPayload])
      .select()
      .single();

    if (error || !lead) {
      return res.status(500).json({
        success: false,
        error: "lead_insert_failed",
      });
    }

    /* ---------- async telegram notify ---------- */
    sendTelegram(
      `NEW LEAD\n\n` +
      `Name: ${lead.name || "N/A"}\n` +
      `Email: ${lead.email || "N/A"}\n` +
      `City: ${lead.city || "N/A"}\n` +
      `Score: ${score}\n` +
      `Tier: ${tier}\n` +
      `Price: $${price}`
    );

    /* ---------- stripe checkout ---------- */
    const session = await createCheckoutSession({
      lead,
      tier,
      score,
      price,
    });

    /* ---------- store session ---------- */
    await supabase
      .from("leads")
      .update({ stripe_session_id: session.id })
      .eq("id", lead.id);

    sendTelegram(
      `CHECKOUT CREATED\n\n` +
      `Lead: ${lead.id}\n` +
      `Tier: ${tier}\n` +
      `Amount: $${price}`
    );

    /* ---------- response ---------- */
    return res.status(201).json({
      success: true,
      lead,
      checkout: {
        url: session.url,
        sessionId: session.id,
        leadId: lead.id,
        amount: price,
        tier,
      },
      meta: {
        processingTimeMs: Date.now() - startTime,
      },
    });

  } catch (err) {
    console.error("LEAD ROUTE ERROR:", err);

    sendTelegram(
      `SYSTEM ERROR\n\n${err.message || "Unknown error"}`
    );

    return res.status(500).json({
      success: false,
      error: "internal_error",
    });
  }
});

module.exports = router;