require("dotenv").config();

const express = require("express");
const app = express();

/* ===============================
   IMPORT BOOTSTRAP
=============================== */
const bootstrapApp = require("./app/bootstrap"); // adjust path if needed

/* ===============================
   RAW BODY FOR STRIPE WEBHOOKS
=============================== */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));

/* ===============================
   JSON MIDDLEWARE
=============================== */
app.use(express.json({ limit: "1mb" }));

/* ===============================
   HEALTH CHECK (RENDER TEST)
=============================== */
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    service: "northsky-flow-os",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

/* ===============================
   ROOT ROUTE (FIX "Cannot GET /")
=============================== */
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "NorthSky API running",
  });
});

/* ===============================
   BOOTSTRAP SYSTEM (CRITICAL)
   - Telegram
   - Call Center
   - Stripe
   - Queue
   - Metering
   - Cron
=============================== */
async function start() {
  try {
    console.log("Starting server...");

    await bootstrapApp(app);

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error("BOOTSTRAP FAILED:", err);
    process.exit(1);
  }
}

start();