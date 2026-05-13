const { verifyToken } = require("../lib/jwt");
const logger = require("../lib/logger");

/* ===============================
   EXTRACT TOKEN
=============================== */
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) return null;

  // Format: Bearer <token>
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
};

/* ===============================
   AUTH MIDDLEWARE (CORE)
=============================== */
const requireAuth = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Missing auth token",
      });
    }

    const decoded = verifyToken(token);

    // attach user to request
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user",
      plan: decoded.plan || "starter",
    };

    next();
  } catch (err) {
    logger.warn(
      {
        error: err.message,
        path: req.path,
      },
      "Auth failed"
    );

    return res.status(401).json({
      success: false,
      error: "Invalid or expired token",
    });
  }
};

/* ===============================
   ROLE-BASED ACCESS
=============================== */
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Not authenticated",
      });
    }

    if (req.user.role !== role) {
      return res.status(403).json({
        success: false,
        error: "Insufficient permissions",
        requiredRole: role,
        currentRole: req.user.role,
      });
    }

    next();
  };
};

/* ===============================
   OPTIONAL AUTH (PUBLIC ROUTES)
=============================== */
const optionalAuth = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);

    if (!token) return next();

    const decoded = verifyToken(token);

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user",
      plan: decoded.plan || "starter",
    };

    next();
  } catch {
    // ignore invalid token
    next();
  }
};

/* ===============================
   EXPORTS
=============================== */
module.exports = {
  requireAuth,
  requireRole,
  optionalAuth,
};