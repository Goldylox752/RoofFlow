const router = require("express").Router();
const { z } = require("zod");

const { createLead, getLeads } = require("../services/leads.service");

/* ===============================
   VALIDATION SCHEMA
=============================== */
const createLeadSchema = z.object({
  name: z.string().min(1),
  city: z.string().min(1),
  category: z.string().min(1),
  value: z.number().min(0).optional(),
  score: z.number().min(0).max(100).optional(),
});

/* ===============================
   CREATE LEAD
=============================== */
router.post("/", async (req, res) => {
  try {
    // Validate input
    const parsed = createLeadSchema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: "Invalid request data",
        details: parsed.error.flatten(),
      });
    }

    // Create lead via service layer
    const lead = await createLead(parsed.data);

    return res.status(201).json({
      success: true,
      lead,
    });
  } catch (err) {
    console.error("Create lead error:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to create lead",
    });
  }
});

/* ===============================
   GET ALL LEADS
=============================== */
router.get("/", async (req, res) => {
  try {
    const leads = await getLeads();

    return res.status(200).json({
      success: true,
      leads,
    });
  } catch (err) {
    console.error("Get leads error:", err);

    return res.status(500).json({
      success: false,
      error: "Failed to fetch leads",
    });
  }
});

module.exports = router;