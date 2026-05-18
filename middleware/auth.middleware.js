const { verifyToken } = require("@clerk/backend");

const PUBLIC_ROUTES = [
  "/api/telegram/webhook",
  "/stripe-webhook",
];

/**
 * AUTH MIDDLEWARE (SAFE VERSION)
 */
module.exports = async function auth(req, res, next) {
  try {
    const rawPath = (req.originalUrl || req.url || "").split("?")[0];
    const normalizedPath = rawPath.replace(/\/$/, "");

    // --------------------------------------------------
    // 1. FORCE PUBLIC ROUTES FIRST (HARD GUARANTEE)
    // --------------------------------------------------
    const isTelegramWebhook = normalizedPath.startsWith("/api/telegram/webhook");
    const isStripeWebhook = normalizedPath.startsWith("/stripe-webhook");

    if (isTelegramWebhook || isStripeWebhook) {
      return next();
    }

    if (PUBLIC_ROUTES.includes(normalizedPath)) {
      return next();
    }

    // --------------------------------------------------
    // 2. REQUIRE AUTH FOR EVERYTHING ELSE
    // --------------------------------------------------
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "missing_auth" });
    }

    const token = header.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      return res.status(401).json({ error: "invalid_session" });
    }

    // --------------------------------------------------
    // 3. ATTACH USER
    // --------------------------------------------------
    req.user = {
      id: payload.sub,
      email: payload.email || payload.email_address || null,
      role: payload.public_metadata?.role || "user",
      plan: payload.public_metadata?.plan || "starter",
    };

    return next();

  } catch (err) {
    console.error("[AUTH ERROR]", err.message);

    // IMPORTANT: never leak auth failure into webhook routes
    const rawPath = (req.originalUrl || req.url || "").split("?")[0];

    if (rawPath.includes("/api/telegram/webhook")) {
      return res.sendStatus(200); // prevent Telegram retries
    }

    return res.status(401).json({ error: "unauthorized" });
  }
};