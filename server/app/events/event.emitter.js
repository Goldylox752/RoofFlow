const { createEvent } = require("../contracts/event.contract");

const events = [];

async function emitEvent({ type, lead, decision, metadata }) {
  const event = createEvent({
    type,
    lead,
    decision,
    metadata,
  });

  // store (DB later, memory now)
  events.push(event);

  console.log("[event]", event.type);

  return event;
}

module.exports = {
  emitEvent,
};