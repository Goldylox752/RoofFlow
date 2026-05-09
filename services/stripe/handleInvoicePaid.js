const supabase = require("../../lib/supabase");

/* ===============================
   HANDLE INVOICE.PAID EVENT
=============================== */
async function handleInvoicePaid(invoice) {
  try {
    const email =
      invoice.customer_email ||
      invoice.customer_details?.email;

    if (!email) {
      console.error("Missing email in invoice.paid");
      return;
    }

    const cleanEmail = email.toLowerCase().trim();

    const { error } = await supabase
      .from("leads")
      .update({
        paid: true,
        status: "active",
        last_invoice_paid_at: new Date().toISOString(),
        stripe_customer_id: invoice.customer,
      })
      .eq("email", cleanEmail);

    if (error) {
      console.error("Supabase update error:", error);
      throw error;
    }

    console.log("Invoice paid processed:", cleanEmail);

  } catch (err) {
    console.error("handleInvoicePaid error:", err);
  }
}

module.exports = handleInvoicePaid;