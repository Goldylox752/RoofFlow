const { createLead } = require("../services/leads.service");
const validateLead = require("../utils/validateLead");

exports.createLead = async (req, res, next) => {
  try {
    /* ===============================
       VALIDATION
    =============================== */
    const error = validateLead(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          message: error,
        },
      });
    }

    const { email, phone, company } = req.body;

    /* ===============================
       IDEMPOTENCY GUARD (PREVENT DUPLICATES)
    =============================== */
    const existing = await createLead.findDuplicate?.({
      email,
      phone,
      company,
    });

    if (existing) {
      return res.status(200).json({
        success: true,
        data: existing,
        duplicate: true,
      });
    }

    /* ===============================
       CREATE LEAD
    =============================== */
    const lead = await createLead(req.body);

    /* ===============================
       OPTIONAL: AI SCORING HOOK (SAFE PLACEHOLDER)
    =============================== */
    // You can plug OpenAI scoring here later
    // lead.score = await aiScoreLead(lead);

    /* ===============================
       RESPONSE
    =============================== */
    return res.status(201).json({
      success: true,
      data: lead,
    });

  } catch (err) {
    /* ===============================
       ERROR HANDLING
    =============================== */
    console.error("[CREATE_LEAD_ERROR]", err);

    return res.status(500).json({
      success: false,
      error: {
        message: "Internal server error",
      },
    });
  }
};