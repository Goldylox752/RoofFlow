const express = require("express");
const bot = require("./config/telegram");
const { send } = require("./services/telegram.service");
const { getOrCreateUser, isPro } = require("./services/user.service");
const { createCheckoutSession } = require("./services/stripe.service");
const { PORT } = require("./config/env");

const app = express();

/* RAW BODY FOR STRIPE */
app.use("/stripe-webhook", express.raw({ type: "application/json" }));
app.use(express.json({ limit: "1mb" }));

/* TELEGRAM COMMANDS */
bot.setMyCommands([
  { command: "start", description: "Start" },
  { command: "profile", description: "Profile" },
  { command: "plan", description: "Plan" },
  { command: "upgrade", description: "Upgrade" },
]);

bot.onText(/\/start/, async (msg) => {
  const user = await getOrCreateUser(msg.from);

  await send(msg.chat.id, `Welcome ${user.username} | ${user.plan}`);

  if (!isPro(user)) {
    await send(msg.chat.id, "Upgrade for PRO access");
  }
});

bot.onText(/\/profile/, async (msg) => {
  const user = await getOrCreateUser(msg.from);

  await send(
    msg.chat.id,
    `User: ${user.username}\nPlan: ${user.plan}`
  );
});

bot.onText(/\/plan/, async (msg) => {
  const user = await getOrCreateUser(msg.from);

  await send(
    msg.chat.id,
    `Plan: ${user.plan}`
  );
});

bot.onText(/\/upgrade/, async (msg) => {
  const user = await getOrCreateUser(msg.from);

  const session = await createCheckoutSession(user.telegram_id);

  await send(msg.chat.id, session.url);
});

/* HEALTH */
app.get("/health", (req, res) => {
  res.json({ ok: true });
});

module.exports = app;