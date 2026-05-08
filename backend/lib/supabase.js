const { createClient } = require("@supabase/supabase-js");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   HARD DISABLE REALTIME (CRITICAL FIX)
=============================== */
const supabase = createClient(url, key, {
  db: {
    schema: "public",
  },
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  realtime: {
    enabled: false,
    transport: undefined, // 🔥 forces NO websocket init
  },
});

module.exports = supabase;