const portalService = require("../services/portal.service");
const billingService = require("../services/billing.service");

/* ===============================
   PORTAL SESSION
=============================== */
exports.createPortal = async (req, res) => {
  try {
    const result = await portalService.createPortalSession(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ===============================
   CUSTOMER
=============================== */
exports.getCustomer = async (req, res) => {
  try {
    const result = await billingService.getCustomer(req.query.email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/* ===============================
   CANCEL
=============================== */
exports.cancelSubscription = async (req, res) => {
  try {
    const result = await portalService.cancelSubscription(req.body.email);
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};