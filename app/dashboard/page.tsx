"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function Dashboard() {
  const [sub, setSub] = useState<any>(null);

  useEffect(() => {
    async function load() {
      const res = await api("/api/leads"); // example protected route
      setSub(res);
    }

    load();
  }, []);

  return (
    <main style={{ padding: 40 }}>
      <h1>Dashboard</h1>

      {!sub ? (
        <p>Loading...</p>
      ) : (
        <pre>{JSON.stringify(sub, null, 2)}</pre>
      )}
    </main>
  );
}