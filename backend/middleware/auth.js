const auth = require("./middleware/auth");

const PUBLIC_ROUTES = [
  "/api/telegram/webhook",
  "/stripe-webhook",
];

app.use((req, res, next) => {
  const path = req.originalUrl.split("?")[0];

  // ALWAYS allow webhooks FIRST (hard bypass)
  if (PUBLIC_ROUTES.some(r => path.startsWith(r))) {
    return next();
  }

  // protect everything else under /api
  if (path.startsWith("/api")) {
    return auth(req, res, next);
  }

  next();
});