export async function sendEmail({ to, template }) {
  if (!to) {
    throw new Error("Missing recipient email (to)");
  }

  if (!template) {
    throw new Error("Missing email template");
  }

  try {
    console.log("sending email", { to, template });

    // TODO: integrate real provider (Resend, SendGrid, SES, etc.)
    return {
      success: true,
      sent: true,
      to,
      template,
      sent_at: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[sendEmail] failed:", err);

    return {
      success: false,
      error: err.message || "Email send failed",
    };
  }
}