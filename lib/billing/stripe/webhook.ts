import { stripe } from "@/lib/stripe";
import { processStripeEvent } from "./processor";

export async function stripeWebhookHandler(req: any, res: any) {
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET!
    );

    await processStripeEvent(event);

    res.sendStatus(200);
  } catch (err: any) {
    console.error("Webhook error:", err.message);
    res.sendStatus(400);
  }
}