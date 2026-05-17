"use client";

import { useEffect, useState } from "react";
import { useUser, useAuth } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function Dashboard() {
  const { isLoaded, isSignedIn } = useUser();
  const { getToken } = useAuth();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    async function loadDashboard() {
      try {
        if (!isSignedIn) {
          setLoading(false);
          return;
        }

        /* ===============================
           GET CLERK TOKEN (SECURE AUTH)
        =============================== */
        const token = await getToken();

        /* ===============================
           LOAD REVENUE DATA (AUTHED)
        =============================== */
        const res = await fetch(`${API_URL}/api/analytics/revenue`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to load revenue");
        }

        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading dashboard");
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [isLoaded, isSignedIn]);

  /* ===============================
     LOADING
  =============================== */
  if (loading || !isLoaded) {
    return <div style={{ padding: 40 }}>Loading dashboard...</div>;
  }

  /* ===============================
     NOT SIGNED IN
  =============================== */
  if (!isSignedIn) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Not signed in</h2>
        <p>Please log in to access dashboard.</p>
      </div>
    );
  }

  /* ===============================
     ERROR
  =============================== */
  if (error) {
    return (
      <div style={{ padding: 40 }}>
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  /* ===============================
     DASHBOARD
  =============================== */
  return (
    <div style={{ padding: 40 }}>
      <h1>NorthSky Dashboard</h1>

      <p>Live System Overview</p>

      {/* REVENUE */}
      <div style={{ marginTop: 20 }}>
        <h3>Revenue</h3>

        {data ? (
          <>
            <p>
              Total Revenue: $
              {(data.totalRevenue / 100).toFixed(2)}
            </p>
            <p>Total Leads: {data.totalLeads}</p>
            <p>Paid Leads: {data.paidLeads}</p>
            <p>Conversion Rate: {data.conversionRate}%</p>
          </>
        ) : (
          <p>Loading revenue...</p>
        )}
      </div>

      {/* SYSTEM STATUS */}
      <div style={{ marginTop: 30 }}>
        <h3>System Status</h3>
        <ul>
          <li>Leads Engine: Active</li>
          <li>Stripe Payments: Connected</li>
          <li>Webhook Processing: Live</li>
          <li>Revenue Tracking: Enabled</li>
        </ul>
      </div>
    </div>
  );
}