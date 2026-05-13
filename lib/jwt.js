const jwt = require("jsonwebtoken");

/* ===============================
   ENV SAFETY
=============================== */
const getSecret = () => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("Missing JWT_SECRET");
  }

  return secret;
};

/* ===============================
   JWT CONFIG (SAAS SAFE DEFAULTS)
=============================== */
const JWT_OPTIONS = {
  issuer: "flow-os-backend",
  audience: "flow-os-client",
  expiresIn: "7d",
};

/* ===============================
   SIGN TOKEN
=============================== */
const signToken = (payload, expiresIn = JWT_OPTIONS.expiresIn) => {
  return jwt.sign(payload, getSecret(), {
    ...JWT_OPTIONS,
    expiresIn,
  });
};

/* ===============================
   VERIFY TOKEN (HARDENED)
=============================== */
const verifyToken = (token) => {
  if (!token || typeof token !== "string") {
    throw new Error("Invalid token format");
  }

  try {
    return jwt.verify(token, getSecret(), JWT_OPTIONS);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      throw new Error("Token expired");
    }

    if (err.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }

    throw err;
  }
};

/* ===============================
   DECODE (NO VALIDATION)
=============================== */
const decodeToken = (token) => {
  return jwt.decode(token);
};

module.exports = {
  signToken,
  verifyToken,
  decodeToken,
};