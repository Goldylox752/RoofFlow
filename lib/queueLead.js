export async function queueLead(lead) {
  console.log("Queued lead:", lead);

  return {
    success: true,
    queued: true,
  };
}