function assertEnv(name) {
  if (!process.env[name]) {
    throw new Error(`Missing ${name}`);
  }
}

assertEnv("TELEGRAM_BOT_TOKEN");
assertEnv("STRIPE_SECRET_KEY");

module.exports = process.env;