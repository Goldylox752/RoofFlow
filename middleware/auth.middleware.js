const { verifyToken } = require("../lib/jwt");
const { getSession } = require("../lib/sessionStore");
const logger = require("../lib/logger");

const auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        error: "Missing or invalid authorization header",
      });
    }

    const token = header.split(" ")[1];

    let decoded;

    try {
      decoded = verifyToken(token);
    } catch (err) {
      logger.warn(
        {
          error: err.message,
          path: req.path,
          ip: req.ip,
        },
        "JWT verification failed"
      );

      if (err.message === "Token expired") {
        return res.status(401).json({
          success: false,
          error: "Token expired",
        });
      }

      return res.status(401).json({
        success: false,
        error: "Invalid token",
      });
    }

    // 🔐 SESSION CHECK (CORE SECURITY LAYER)
    if (!decoded?.jti) {
      return res.status(401).json({
        success: false,
        error: "Invalid session token",
      });
    }

    const session = getSession(decoded.jti);

    if (!session) {
      return res.status(401).json({
        success: false,
        error: "Session expired or revoked",
      });
    }

    // attach user safely
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role || "user",
      plan: decoded.plan || "starter",
      jti: decoded.jti,
    };

    req.session = session;

    next();
  } catch (err) {
    logger.error(
      {
        error: err.message,
        stack: err.stack,
        path: req.path,
      },
      "Auth middleware crash"
    );

    return res.status(401).json({
      success: false,
      error: "Unauthorized",
    });
  }
};

module.exports = auth;