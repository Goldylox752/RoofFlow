const ADMIN_IDS = (process.env.ADMIN_IDS || "")
  .split(",")
  .map((id) => id.trim())
  .filter(Boolean);

function isAdmin(userId) {
  return ADMIN_IDS.includes(String(userId));
}

function deny(bot, msg) {
  return bot.sendMessage(msg.chat.id, "Access denied");
}

module.exports = { isAdmin, deny };