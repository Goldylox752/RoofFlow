"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Success() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      try {
        // ensure we are in browser
        if (typeof window === "undefined") return;

        // mark user as paid (MVP method)
        localStorage.setItem("user_paid", "true");

        // small delay for UX
        await new Promise((res) => setTimeout(res, 1200));

        // safer navigation method
        router.replace("/dashboard");
      } catch (err) {
        console.error("Success page error:", err);
      }
    };

    run();
  }, [router]);

  return (
    <div
      style={{
        padding: 40,
        color: "#fff",
        background: "#0b0f17",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      <h1>Payment Successful 🎉</h1>
      <p style={{ opacity: 0.7, marginTop: 10 }}>
        Redirecting you to your dashboard...
      </p>
    </div>
  );
}