const { verifyToken } = require("@clerk/backend");

const PUBLIC_ROUTES = [
  "/api/telegram/webhook",
  "/stripe-webhook",
];

module.exports = async function auth(req, res, next) {
  try {
    const rawPath = (req.originalUrl || req.url || "").split("?")[0];
    const normalizedPath = rawPath.replace(/\/$/, "");

    // ---------------------------
    // PUBLIC ROUTES (NO AUTH)
    // ---------------------------
    const isPublic = PUBLIC_ROUTES.some((route) => {
      const normalizedRoute = route.replace(/\/$/, "");
      return normalizedPath === normalizedRoute;
    });

    if (isPublic || normalizedPath.includes("/api/telegram/webhook")) {
      return next();
    }

    // ---------------------------
    // AUTH REQUIRED
    // ---------------------------
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

    // ---------------------------
    // ATTACH USER
    // ---------------------------
    req.user = {
      id: payload.sub,
      email: payload.email || null,
      role: payload.public_metadata?.role || "user",
      plan: payload.public_metadata?.plan || "starter",
    };

    return next();

  } catch (err) {
    return res.status(401).json({ error: "unauthorized" });
  }
};