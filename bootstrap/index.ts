import { bootstrapExpress } from "./express.bootstrap";
import { bootstrapTelegram } from "./telegram.bootstrap";
import { bootstrapStripe } from "./stripe.bootstrap";
import { bootstrapQueue } from "./queue.bootstrap";
import { bootstrapCron } from "./cron.bootstrap";

export async function bootstrapApp(app: any) {
  console.log("🚀 Bootstrapping system...");

  await bootstrapExpress(app);
  await bootstrapTelegram();
  await bootstrapStripe();
  await bootstrapQueue();
  await bootstrapCron();

  console.log("✅ System fully booted");
}