const { verifyToken } = require("@clerk/backend");
const logger = require("../lib/logger");

/**
 * Routes that should NEVER require auth
 * (webhooks, bots, external services)
 */
const PUBLIC_ROUTES = [
  "/api/telegram/webhook",
];

const auth = async (req, res, next) => {
  try {
    const path = req.path || req.url;

    // --------------------------------------------------
    // 1. SKIP PUBLIC ROUTES (Telegram, webhooks, etc.)
    // --------------------------------------------------
    if (PUBLIC_ROUTES.some((route) => path.includes(route))) {
      return next();
    }

    // --------------------------------------------------
    // 2. REQUIRE AUTH HEADER FOR PROTECTED ROUTES
    // --------------------------------------------------
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "missing_authorization_header",
      });
    }

    const token = header.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      return res.status(401).json({
        success: false,
        error: "invalid_session",
      });
    }

    // --------------------------------------------------
    // 3. ATTACH USER CONTEXT
    // --------------------------------------------------
    req.user = {
      id: payload.sub,
      email: payload.email || payload.email_address || null,
      role: payload.public_metadata?.role || "user",
      plan: payload.public_metadata?.plan || "starter",
    };

    next();
  } catch (err) {
    logger.warn(
      {
        error: err.message,
        path: req.path,
        ip: req.ip,
      },
      "auth_failed"
    );

    return res.status(401).json({
      success: false,
      error: "unauthorized",
    });
  }
};

module.exports = auth;