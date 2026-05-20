import { createClient } from "@supabase/supabase-js";

/* ===============================
   ENV VALIDATION
=============================== */

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/* ===============================
   CLIENT (FRONTEND)
=============================== */

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: {
      "x-application-name": "northsky-roofflow",
    },
  },
});

/* ===============================
   ADMIN CLIENT (SERVER ONLY)
=============================== */

let adminClient = null;

export const getSupabaseAdmin = () => {
  if (adminClient) return adminClient;

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  adminClient = createClient(supabaseUrl, serviceKey, {
    auth: {
      persistSession: false,
    },
  });

  return adminClient;
};