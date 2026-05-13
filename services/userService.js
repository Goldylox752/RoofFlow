const supabase = require("../lib/supabase");

/* ===============================
   GET OR CREATE USER
=============================== */

async function getUser(tgUser) {
  const { data } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", tgUser.id)
    .maybeSingle();

  if (data) return data;

  const { data: created } = await supabase
    .from("users")
    .insert({
      telegram_id: tgUser.id,
      username: tgUser.username,
      plan: "free",
    })
    .select()
    .single();

  return created;
}

/* ===============================
   UPGRADE USER
=============================== */

async function upgradeUser(userId) {
  return supabase
    .from("users")
    .update({ plan: "pro" })
    .eq("id", userId);
}

/* ===============================
   GET LEADS
=============================== */

async function getLeads(limit = 10) {
  const { data } = await supabase
    .from("leads")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  return data || [];
}

module.exports = {
  getUser,
  upgradeUser,
  getLeads,
};