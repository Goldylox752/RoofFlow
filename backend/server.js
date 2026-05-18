require("dotenv").config();
const express = require("express");
const app = express();

const bootstrapApp = require("./app/bootstrap");

// --------------------
// CORE MIDDLEWARE
// --------------------
app.use(express.json({ limit: "1mb" }));

// --------------------
// HEALTH
// --------------------
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

// --------------------
// PUBLIC WEBHOOKS (NO AUTH)
// --------------------

// Telegram
app.post("/api/telegram/webhook", async (req, res) => {
  try {
    const update = req.body;

    const chatId = update?.message?.chat?.id;
    const text = update?.message?.text;

    if (!chatId) return res.status(200).send("ok");

    const reply =
      text === "/start"
        ? "👋 Bot is live"
        : `You said: ${text}`;

    await fetch(
      `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          text: reply,
        }),
      }
    );

    return res.status(200).send("ok");
  } catch (err) {
    console.error(err);
    return res.status(200).send("ok");
  }
});

// Stripe webhook stays raw if needed
app.use("/stripe-webhook", express.raw({ type: "application/json" }));

// --------------------
// PROTECTED ROUTES (AUTH HERE ONLY)
// --------------------
const auth = require("./middleware/auth");

// Everything under /api (except webhooks) is protected
app.use("/api", (req, res, next) => {
  if (req.path.includes("/telegram/webhook")) return next();
  if (req.path.includes("/stripe-webhook")) return next();

  return auth(req, res, next);
});

// --------------------
// BOOTSTRAP SYSTEM (NO ROUTE LOGIC)
// --------------------
bootstrapApp(app);

// --------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("🚀 Server running on", PORT);
});