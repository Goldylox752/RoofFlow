const express = require("express");
const bcrypt = require("bcryptjs");
const { createClient } = require("@supabase/supabase-js");
const { signToken } = require("../lib/jwt");

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
const normalizeEmail = (email) => {
  if (!email || typeof email !== "string") return null;
  return email.toLowerCase().trim();
};

const safeError = (res, code, message) => {
  return res.status(code).json({
    success: false,
    error: message,
  });
};

/* ===============================
   REGISTER
=============================== */
router.post("/register", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return safeError(res, 400, "Email and password are required");
    }

    if (password.length < 6) {
      return safeError(res, 400, "Password must be at least 6 characters");
    }

    /* CHECK EXISTING USER */
    const { data: existing } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      return safeError(res, 409, "User already exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data, error } = await supabase
      .from("users")
      .insert([
        {
          email,
          password: hashedPassword,
          role: "user",
          plan: "starter",
        },
      ])
      .select("id, email, role, plan")
      .single();

    if (error) {
      console.error("REGISTER_ERROR:", error);
      return safeError(res, 500, "Failed to create user");
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
      user: data,
    });
  } catch (err) {
    console.error("REGISTER_EXCEPTION:", err);
    return safeError(res, 500, "Internal server error");
  }
});

/* ===============================
   LOGIN
=============================== */
router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email);
    const password = req.body.password;

    if (!email || !password) {
      return safeError(res, 400, "Email and password are required");
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, password, role, plan")
      .eq("email", email)
      .maybeSingle();

    if (error || !data) {
      return safeError(res, 401, "Invalid credentials");
    }

    const isValid = await bcrypt.compare(password, data.password);

    if (!isValid) {
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