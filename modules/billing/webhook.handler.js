import { processStripeEvent } from "./event.processor.js";
import { stripe } from "@/lib/stripe";

export async function stripeWebhookHandler(req, res) {
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );

    await processStripeEvent(event);

    res.sendStatus(200);
  } catch (err) {
    console.error("Webhook error:", err.message);
    res.sendStatus(400);
  }
}