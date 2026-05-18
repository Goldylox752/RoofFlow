const { verifyToken } = require("@clerk/backend");

const PUBLIC_ROUTES = [
  "/api/telegram/webhook",
  "/stripe-webhook",
];

module.exports = async function auth(req, res, next) {
  const path = (req.originalUrl || req.url || "").split("?")[0];

  // ---------------------------
  // PUBLIC ROUTES (NO AUTH)
  // ---------------------------
  if (PUBLIC_ROUTES.some(r => path === r || path.startsWith(r))) {
    return next();
  }

  // ---------------------------
  // AUTH REQUIRED
  // ---------------------------
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "missing_auth" });
  }

  try {
    const token = header.split(" ")[1];

    const payload = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });

    if (!payload?.sub) {
      return res.status(401).json({ error: "invalid_session" });
    }

    req.user = {
      id: payload.sub,
      email: payload.email || null,
      role: payload.public_metadata?.role || "user",
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: "unauthorized" });
  }
};