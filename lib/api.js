export async function startCheckout(email, plan) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_URL}/checkout`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, plan }),
    }
  );

  const data = await res.json();

  if (!res.ok || !data.success) {
    throw new Error(data.error || "Checkout failed");
  }

  // 🚨 IMPORTANT FIX
  window.location.href = data.url;
}