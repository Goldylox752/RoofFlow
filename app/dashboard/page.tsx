"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = localStorage.getItem("user_paid");

    if (!user) {
      router.push("/");
      return;
    }

    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 40, color: "#fff", background: "#0b0f17", minHeight: "100vh" }}>
        Loading dashboard...
      </div>
    );
  }

  return (
    <main style={{ padding: 40, color: "#fff", background: "#0b0f17", minHeight: "100vh" }}>
      <h1>Dashboard</h1>

      <p>Welcome to Flow OS</p>

      <div style={{ marginTop: 20 }}>
        <h3>Your system status</h3>
        <ul>
          <li>✅ Stripe connected</li>
          <li>✅ Backend active</li>
          <li>⚡ AI workflows ready</li>
        </ul>
      </div>

      <button
        onClick={() => {
          localStorage.removeItem("user_paid");
          router.push("/");
        }}
        style={{ marginTop: 20 }}
      >
        Logout
      </button>
    </main>
  );
}