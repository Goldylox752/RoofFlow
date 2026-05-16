const supabase = require("../lib/supabase");

module.exports = async (req, res, next) => {
  try {
    const email = req.body?.email || req.query?.email;

    if (!email) {
      return res.status(401).json({ error: "Missing email" });
    }

    const { data } = await supabase
      .from("users")
      .select("status")
      .eq("email", email)
      .maybeSingle();

    if (!data || data.status !== "active") {
      return res.status(403).json({
        error: "Payment required",
      });
    }

    next();
  } catch (err) {
    return res.status(500).json({ error: "Auth check failed" });
  }
};