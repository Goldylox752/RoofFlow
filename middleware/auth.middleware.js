const { createClient } = require("@supabase/supabase-js");

/* ===============================
   SUPABASE CLIENT (NO SERVICE ROLE NEEDED FOR AUTH CHECK)
=============================== */
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/* ===============================
   REAL AUTH MIDDLEWARE (JWT)
=============================== */
module.exports = async function auth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        error: "Missing Authorization header",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Missing token",
      });
    }

    /* ===============================
       VERIFY JWT WITH SUPABASE
    =============================== */
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        error: "Invalid or expired token",
      });
    }

    /* ===============================
       ATTACH SECURE USER OBJECT
    =============================== */
    req.user = {
      id: data.user.id,
      email: data.user.email,
    };

    next();

  } catch (err) {
    console.error("Auth error:", err);

    return res.status(401).json({
      success: false,
      error: "Authentication failed",
    });
  }
};