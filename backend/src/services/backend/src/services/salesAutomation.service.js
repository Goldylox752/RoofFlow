const { sendEmail } = require("./email.service");

async function runSalesAutomation({ lead, sales }) {
  if (!lead?.email) return;

  // =========================
  // EMAIL 1 (INSTANT)
  // =========================
  await sendEmail({
    to: lead.email,
    subject: sales.sales_subject,
    html: `
      <h1>${sales.sales_subject}</h1>
      <p>${sales.sales_body}</p>
      <hr/>
      <p><b>${sales.urgency_hook}</b></p>
    `,
  });

  console.log("Email sent to:", lead.email);

  // =========================
  // FOLLOW-UP 1 (24h delay)
  // =========================
  setTimeout(async () => {
    await sendEmail({
      to: lead.email,
      subject: "Quick follow-up",
      html: `<p>${sales.follow_up_day1}</p>`,
    });

    console.log("Follow-up 1 sent:", lead.email);
  }, 1000 * 60 * 60 * 24);

  // =========================
  // FOLLOW-UP 2 (72h delay)
  // =========================
  setTimeout(async () => {
    await sendEmail({
      to: lead.email,
      subject: "Last check-in",
      html: `<p>${sales.follow_up_day3}</p>`,
    });

    console.log("Follow-up 2 sent:", lead.email);
  }, 1000 * 60 * 60 * 72);
}

module.exports = { runSalesAutomation };