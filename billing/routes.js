const router = require("express").Router();
const controller = require("../controllers/billing.controller");

router.post("/portal", controller.createPortal);
router.get("/customer", controller.getCustomer);
router.post("/cancel", controller.cancelSubscription);

module.exports = router;