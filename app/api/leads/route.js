const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const supabase = require("../lib/supabase");
const stripe = require("../lib/stripe");

const { buildKey } = require("../utils/idempotency");
const { calculateScore, getTier } = require("../utils/scoring");
const { calculatePrice } = require("../services/pricingEngine");

/* ===============================
   ENV SAFETY (FAIL FAST)
=============================== */
const CLIENT_URL = process.env.CLIENT_URL;
if (!CLIENT_URL) {
  throw new Error("Missing CLIENT_URL");
}

const TG_TOKEN = process.env.TG_TOKEN;
const TG_CHAT_ID = process.env.TG_CHAT_ID;

/* ===============================
   TELEGRAM (NON-BLOCKING + SAFE)
=============================== */
async function sendTelegram(message) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;

  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    });
  } catch {
    // never crash main flow
  }
}

/* ===============================
   HELPERS (CLEAN + SAFE)
=============================== */
const clean = (v) =>
  typeof v === "string" ? v.trim() : null;

const normalizeEmail = (email) =>
  clean(email)?.toLowerCase() || null;

const sanitize = (v) =>
  clean(v)?.slice(0, 120) || null;

const getClientIP = (req) =>
  (req.headers["x-forwarded-for"] || "")
    .split(",")[0]
    .trim() || req.ip;

/* ===============================
   STRIPE CHECKOUT CREATION
   (ISOLATED = EASY TO EVOLVE)
=============================== */
async function createCheckout({ lead, tier, score, price }) {
  try {
    return await stripe.checkout.sessions.create({
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
              name: `NorthSky ${tier} Plan`,
              description: "AI-driven SaaS automation system",
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

      success_url: `${CLIENT_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${CLIENT_URL}/cancel`,

      expires_at: Math.floor(Date.now() / 1000) + 60 * 30,
    });
  } catch (err) {
    console.error("Stripe error:", err);
    throw new Error("checkout_creation_failed");
  }
}

/* ===============================
   MAIN ROUTE (AI SALES ENGINE)
=============================== */
router.post("/", async (req, res) => {
  const start = Date.now();

  try {
    /* ---------- INPUT ---------- */
    let {
      name,
      email,
      phone,
      city,
      utm_source,
      utm_campaign,
      utm_medium,
    } = req.body || {};

    name = clean(name);
    email = normalizeEmail(email);
    phone = clean(phone);
    city = clean(city);

    utm_source = sanitize(utm_source);
    utm_campaign = sanitize(utm_campaign);
    utm_medium = sanitize(utm_medium);

    /* ---------- VALIDATION ---------- */
    if (!email && !phone) {
      return res.status(400).json({
        success: false,
        error: "email_or_phone_required",
      });
    }

    /* ---------- IDEMPOTENCY KEY ---------- */
    const idempotencyKey = buildKey(email, phone, city);

    const { data: existingLead } = await supabase
      .from("leads")
      .select("id, email")
      .eq("idempotency_key", idempotencyKey)
      .maybeSingle();

    if (existingLead) {
      return res.json({
        success: true,
        duplicate: true,
        lead: existingLead,
      });
    }

    /* ---------- AI SCORING ENGINE ---------- */
    const score = calculateScore({ email, phone, city });
    const tier = getTier(score);
    const price = calculatePrice(score, city);

    /* ---------- LEAD CREATION ---------- */
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
      ip_address: getClientIP(req),
      user_agent: req.headers["user-agent"] || null,

      created_at: new Date().toISOString(),
    };

    const { data: lead, error } = await supabase
      .from("leads")
      .insert([leadPayload])
      .select()
      .single();

    if (error || !lead) {
      console.error("Supabase insert failed:", error);
      return res.status(500).json({
        success: false,
        error: "lead_insert_failed",
      });
    }

    /* ---------- TELEGRAM ALERT (ASYNC) ---------- */
    sendTelegram(
      `🟢 NEW LEAD\n` +
      `Name: ${lead.name || "N/A"}\n` +
      `Email: ${lead.email || "N/A"}\n` +
      `Score: ${score}\n` +
      `Tier: ${tier}\n` +
      `Price: $${price}`
    );

    /* ---------- STRIPE CHECKOUT ---------- */
    const session = await createCheckout({
      lead,
      tier,
      score,
      price,
    });

    /* ---------- UPDATE LEAD ---------- */
    await supabase
      .from("leads")
      .update({ stripe_session_id: session.id })
      .eq("id", lead.id);

    sendTelegram(
      `💳 CHECKOUT CREATED\nLead: ${lead.id}\nTier: ${tier}`
    );

    /* ---------- RESPONSE ---------- */
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
        processingTimeMs: Date.now() - start,
      },
    });

  } catch (err) {
    console.error("LEAD ROUTE ERROR:", err);

    sendTelegram(`🚨 SYSTEM ERROR\n${err.message || "unknown"}`);

    return res.status(500).json({
      success: false,
      error: "internal_error",
    });
  }
});

module.exports = router;