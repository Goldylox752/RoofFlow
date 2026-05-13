const express = require("express");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { signToken } = require("../lib/jwt");

const router = express.Router();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/* ===============================
   HELPERS
=============================== */
const normalizeEmail = (email) => {
  return typeof email === "string" ? email.toLowerCase().trim() : null;
};

const safeError = (res, code, message) => {
  return res.status(code).json({
    success: false,
    error: message,
  });
};

/* ===============================
   REGISTER (HARDENED)
=============================== */
router.post("/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return safeError(res, 400, "Email and password required");
    }

    if (password.length < 6) {
      return safeError(res, 400, "Password too short (min 6 chars)");
    }

    /* CHECK DUPLICATES */
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return safeError(res, 409, "Email already registered");
    }

    const hashed = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashed,
          role: "user",
          plan: "starter",
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("REGISTER_ERROR:", error);
      return safeError(res, 500, "Registration failed");
    }

    const token = signToken({
      id: data.id,
      email: data.email,
      role: data.role,
      plan: data.plan,
    });

    return res.status(201).json({
      success: true,
      token,
      user: {
        id: data.id,
        email: data.email,
        role: data.role,
        plan: data.plan,
      },
    });
  } catch (err) {
    console.error("REGISTER_EXCEPTION:", err);
    return safeError(res, 500, "Internal server error");
  }
});

/* ===============================
   LOGIN (HARDENED)
=============================== */
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return safeError(res, 400, "Email and password required");
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, role, plan")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) {
      return safeError(res, 401, "Invalid credentials");
    }

    const valid = await bcrypt.compare(password, data.password);

    if (!valid) {
      return safeError(res, 401, "Invalid credentials");
    }

    const token = signToken({
      id: data.id,
      email: data.email,
      role: data.role,
      plan: data.plan,
    });

    return res.json({
      success: true,
      token,
      user: {
        id: data.id,
        email: data.email,
        role: data.role,
        plan: data.plan,
      },
    });
  } catch (err) {
    console.error("LOGIN_EXCEPTION:", err);
    return safeError(res, 500, "Internal server error");
  }
});

module.exports = router;