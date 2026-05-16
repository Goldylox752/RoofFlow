function decideAction({ score, classification, lead }) {
  if (classification === "HOT") {
    return {
      action: "SEND_SALES_ALERT",
      priority: "HIGH",
      message: `Hot lead detected: ${lead.email}`,
    };
  }

  if (classification === "WARM") {
    return {
      action: "SEND_EMAIL_SEQUENCE",
      priority: "MEDIUM",
      message: `Nurture lead: ${lead.email}`,
    };
  }

  return {
    action: "ADD_TO_REMARKETING",
    priority: "LOW",
    message: `Cold lead: ${lead.email}`,
  };
}

module.exports = { decideAction };