import { supabase } from "@/lib/supabase/client";

/**
 * GET BALANCE
 */
export async function getBalance(contractorId: string) {
  const { data, error } = await supabase
    .from("contractors")
    .select("balance_cents")
    .eq("id", contractorId)
    .single();

  if (error) throw new Error(error.message);

  return data?.balance_cents ?? 0;
}

/**
 * DEDUCT CREDIT
 */
export async function deductCredit(
  contractorId: string,
  amount: number,
  leadId: string
) {
  if (!contractorId || !leadId) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const { data, error } = await supabase.rpc("deduct_credit", {
    p_contractor_id: contractorId,
    p_amount: amount,
    p_lead_id: leadId,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  if (!data?.success) {
    return {
      success: false,
      error: data?.error || "INSUFFICIENT_FUNDS_OR_LOCKED",
    };
  }

  return {
    success: true,
    balance: data.balance,
    deducted: amount,
  };
}

/**
 * ADD CREDIT
 */
export async function addCredit(
  contractorId: string,
  amount: number,
  source: string = "manual"
) {
  if (!contractorId || amount <= 0) {
    return { success: false, error: "INVALID_INPUT" };
  }

  const { data, error } = await supabase.rpc("add_credit", {
    p_contractor_id: contractorId,
    p_amount: amount,
    p_source: source,
  });

  if (error) {
    return { success: false, error: error.message || "TOPUP_FAILED" };
  }

  return {
    success: true,
    balance: data.balance,
    added: amount,
  };
}

/**
 * CHECK AFFORDABILITY
 */
export async function canAffordLead(contractorId: string, leadCost: number) {
  const balance = await getBalance(contractorId);
  return balance >= leadCost;
}