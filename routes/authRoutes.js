const express = require("express");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const crypto = require("crypto");

// ⚠️ These MUST exist at these paths
const { signAccessToken, signRefreshToken } = require("../lib/jwt");
const { createSession, deleteSession } = require("../lib/session.store");

const router = express.Router();

/* ===============================
   SUPABASE CLIENT
=============================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   HELPERS
=============================== */
const normalizeEmail = (email) =>
  typeof email === "string" ? email.toLowerCase().trim() : null;

const sendError = (res, status, code) => {
  return res.status(status).json({
    success: false,
    error: code,
  });
};

/* ===============================
   REGISTER
=============================== */
router.post("/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return sendError(res, 400, "missing_credentials");
    }

    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return sendError(res, 409, "user_exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error: insertError } = await supabase
      .from("users")
      .insert({
        email,
        password: hashedPassword,
        role: "user",
        plan: "starter",
      })
      .select("id, email, role, plan")
      .single();

    if (insertError) {
      console.error("SUPABASE_INSERT_ERROR", insertError);
      return sendError(res, 500, "registration_failed");
    }

    return res.status(201).json({
      success: true,
      user: data,
    });
  } catch (err) {
    console.error("REGISTER_ERROR", err);
    return sendError(res, 500, "registration_failed");
  }
});

/* ===============================
   LOGIN
=============================== */
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = req.body?.password;

    if (!email || !password) {
      return sendError(res, 400, "missing_credentials");
    }

    const { data: user } = await supabase
      .from("users")
      .select("id, email, password, role, plan")
      .eq("email", email)
      .maybeSingle();

    if (!user) {
      return sendError(res, 401, "invalid_credentials");
    }

    const passwordOk = await bcrypt.compare(password, user.password);

    if (!passwordOk) {
      return sendError(res, 401, "invalid_credentials");
    }

    const jti = crypto.randomUUID();

    const tokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
      plan: user.plan,
      jti,
    };

    const accessToken = signAccessToken(tokenPayload);
    const refreshToken = signRefreshToken(tokenPayload);

    await createSession(jti, {
      userId: user.id,
      email: user.email,
    });

    return res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.plan,
      },
    });
  } catch (err) {
    console.error("LOGIN_ERROR", err);
    return sendError(res, 500, "login_failed");
  }
});

/* ===============================
   LOGOUT
=============================== */
router.post("/logout", async (req, res) => {
  try {
    const jti = req.body?.jti;

    if (jti) {
      await deleteSession(jti);
    }

    return res.json({
      success: true,
      message: "logged_out",
    });
  } catch (err) {
    console.error("LOGOUT_ERROR", err);
    return sendError(res, 500, "logout_failed");
  }
});

module.exports = router;