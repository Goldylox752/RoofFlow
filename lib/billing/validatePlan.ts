import { PRICE_MAP } from "./pricing";

export function getPriceId(plan: string) {
  return PRICE_MAP[plan as keyof typeof PRICE_MAP] || null;
}