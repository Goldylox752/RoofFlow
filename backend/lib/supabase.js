const { createClient } = require("@supabase/supabase-js");
const ws = require("ws");

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   FORCE NODE WEBSOCKET SUPPORT
=============================== */
const supabase = createClient(url, key, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },

  realtime: {
    enabled: false,
    transport: ws, // 🔥 THIS STOPS THE CRASH
  },
});

module.exports = supabase;