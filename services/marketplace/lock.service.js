const supabase = require("../../lib/supabase");

exports.lockLead = async (leadId, userId) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const { data, error } = await supabase
    .from("leads")
    .update({
      status: "locked",
      locked_by: userId,
      locked_at: new Date().toISOString(),
      lock_expires_at: expiresAt.toISOString(),
    })
    .eq("id", leadId)
    .eq("status", "available")
    .select()
    .single();

  if (error || !data) return null;

  return data;
};

exports.unlockLead = async (leadId) => {
  await supabase
    .from("leads")
    .update({
      status: "available",
      locked_by: null,
      locked_at: null,
      lock_expires_at: null,
    })
    .eq("id", leadId);
};