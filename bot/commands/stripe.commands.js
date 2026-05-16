const Stripe = require("stripe");
const { isAdmin } = require("../core/guard");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = (bot) => {
  bot.onText(/\/addproduct (.+) (\d+)/, async (msg, match) => {
    if (!isAdmin(msg.from.id)) return;

    const name = match[1];
    const price = Number(match[2]);

    try {
      const product = await stripe.products.create({ name });

      const priceObj = await stripe.prices.create({
        product: product.id,
        unit_amount: price * 100,
        currency: "usd",
      });

      bot.sendMessage(
        msg.chat.id,
        `Product Created\n${name}\n$${price}\nPrice ID: ${priceObj.id}`
      );
    } catch {
      bot.sendMessage(msg.chat.id, "Error creating product");
    }
  });

  bot.onText(/\/products/, async (msg) => {
    if (!isAdmin(msg.from.id)) return;

    const products = await stripe.products.list({ limit: 10 });

    const text = products.data
      .map((p) => `• ${p.name} (${p.id})`)
      .join("\n");

    bot.sendMessage(msg.chat.id, text || "No products");
  });

  bot.onText(/\/checkout (.+)/, async (msg, match) => {
    if (!isAdmin(msg.from.id)) return;

    const priceId = match[1];

    try {
      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
      });

      bot.sendMessage(msg.chat.id, session.url);
    } catch {
      bot.sendMessage(msg.chat.id, "Checkout error");
    }
  });
};