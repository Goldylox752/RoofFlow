export async function queueLead(lead) {
  console.log("[queueLead]", lead);

  return {
    success: true,
    queued: true,
  };
}