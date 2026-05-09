const router = require("express").Router();
const { createPortalSession } = require("../lib/portal");

router.post("/", async (req, res) => {
  try {
    const { customerId } = req.body;

    const session = await createPortalSession(customerId);

    res.json({
      success: true,
      url: session.url,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
});

module.exports = router;