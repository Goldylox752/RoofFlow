const { dispatchLead } = require("../dispatcher/ai.dispatcher");

async function createLead(req, res) {
  const lead = req.body;

  const result = await dispatchLead(lead);

  res.json(result);
}

module.exports = { createLead };