"use client";

import { useState } from "react";

type FormState = {
  name: string;
  email: string;
  city: string;
};

export default function CheckoutPage() {
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState<FormState>({
    name: "",
    email: "",
    city: "Calgary",
  });

  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleCheckout = async () => {
    if (!API_URL) return alert("System error. Try again later.");
    if (!form.name || !form.email)
      return alert("Please enter your name and email");

    try {
      setLoading(true);

      const res = await fetch(`${API_URL}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          city: form.city,
          phone: null,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data?.checkoutUrl) {
        return alert(data?.error || "Checkout failed");
      }

      localStorage.setItem("leadId", data.lead.id);
      window.location.href = data.checkoutUrl;
    } catch (err) {
      console.error(err);
      alert("Error starting checkout");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ background: "#0b0f19", color: "white", minHeight: "100vh" }}>
      <section style={{ padding: "110px 20px", textAlign: "center" }}>
        <h1 style={{ fontSize: 54 }}>Start Getting Leads</h1>

        <div style={{ maxWidth: 420, margin: "40px auto", display: "grid", gap: 12 }}>
          <input
            name="name"
            placeholder="Name"
            value={form.name}
            onChange={handleChange}
            style={{ padding: 14, borderRadius: 8 }}
          />

          <input
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            style={{ padding: 14, borderRadius: 8 }}
          />

          <button
            onClick={handleCheckout}
            disabled={loading}
            style={{
              padding: 16,
              background: loading ? "#64748b" : "#22c55e",
              borderRadius: 10,
              fontWeight: "bold",
            }}
          >
            {loading ? "Processing..." : "Start"}
          </button>
        </div>
      </section>
    </div>
  );
}