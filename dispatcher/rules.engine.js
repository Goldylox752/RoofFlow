export function routeLead(lead) {
  const score = lead?.score || 0;

  if (score >= 80) {
    return {
      type: "CALL",
      priority: "high",
      contractor: selectBestContractor(lead),
    };
  }

  if (score >= 50) {
    return {
      type: "SMS",
      priority: "medium",
      contractor: selectBestContractor(lead),
    };
  }

  return {
    type: "HOLD",
    priority: "low",
  };
}

/* placeholder logic (replace later with real matching system) */
function selectBestContractor(lead) {
  return {
    id: "c1",
    phone: "+123456789",
    skillsMatch: true,
  };
}