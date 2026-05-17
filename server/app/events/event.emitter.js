const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function saveEvent(event) {
  const { data, error } = await supabase
    .from("events")
    .insert({
      id: event.id,
      type: event.type,
      lead: event.lead,
      decision: event.decision,
      metadata: event.metadata,
      created_at: event.timestamp,
    });

  if (error) {
    console.error("[event-store] failed", error.message);
    throw error;
  }

  return data;
}

module.exports = {
  saveEvent,
};