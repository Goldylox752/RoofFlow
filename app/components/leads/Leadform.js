"use client";

import { useState } from "react";
import { submitLead } from "@/lib/services/leads";

export default function LeadForm({ city }) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!phone) {
      alert("Please enter a phone number");
      return;
    }

    try {
      setLoading(true);

      await submitLead({
        phone,
        city,
        score: 7,
        cityTier: "basic",
      });

      alert("Lead submitted");
      setPhone("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrapper}>
      <input
        placeholder="Phone"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        style={styles.input}
      />

      <button
        onClick={handleSubmit}
        style={styles.button}
        disabled={loading}
      >
        {loading ? "Submitting..." : "Submit Lead"}
      </button>
    </div>
  );
}

const styles = {
  wrapper: {
    width: "100%",
  },

  input: {
    padding: 12,
    width: "100%",
    marginBottom: 10,
    border: "1px solid #ccc",
    borderRadius: 8,
    fontSize: 16,
  },

  button: {
    padding: 12,
    width: "100%",
    background: "#4da3ff",
    color: "white",
    border: "none",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 16,
    fontWeight: "bold",
  },
};