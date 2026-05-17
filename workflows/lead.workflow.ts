import { qualificationAgent } from "../agents/qualification.agent";
import { salesAgent } from "../agents/sales.agent";

export async function leadWorkflow(lead) {
  const qualified = await qualificationAgent(lead);

  if (!qualified) return;

  return await salesAgent(lead);
}