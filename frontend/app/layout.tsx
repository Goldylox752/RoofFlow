import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NorthSky — AI Automation SaaS Platform",
  description:
    "Launch automation systems, Telegram bots, Stripe billing, analytics dashboards, and scalable SaaS infrastructure with NorthSky.",
  keywords: [
    "AI SaaS",
    "Telegram automation",
    "Stripe SaaS",
    "automation backend",
    "analytics dashboard",
    "startup infrastructure",
    "SaaS platform",
  ],

  openGraph: {
    title: "NorthSky",
    description:
      "Modern automation infrastructure for SaaS founders and AI businesses.",
    url: "https://northsky.app",
    siteName: "NorthSky",
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "NorthSky",
    description:
      "Operate AI automation systems with Stripe, Telegram, analytics, and scalable SaaS infrastructure.",
  },

  themeColor: "#070b12",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={styles.body}>
        {/* BACKGROUND LAYERS */}
        <div style={styles.primaryGlow} />
        <div style={styles.secondaryGlow} />
        <div style={styles.gridOverlay} />

        {/* APP */}
        <div style={styles.container}>{children}</div>
      </body>
    </html>
  );
}

/* ===============================
   STYLES
=============================== */

const styles: Record<string, React.CSSProperties> = {
  body: {
    margin: 0,
    padding: 0,
    background:
      "linear-gradient(to bottom, #050816 0%, #070b12 40%, #050816 100%)",
    color: "#ffffff",
    fontFamily:
      "Inter, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
    overflowX: "hidden",
    minHeight: "100vh",
    position: "relative",
  },

  container: {
    position: "relative",
    zIndex: 10,
  },

  /* TOP LEFT GLOW */
  primaryGlow: {
    position: "fixed",
    top: "-250px",
    left: "-250px",
    width: "700px",
    height: "700px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(99,102,241,0.22), transparent 65%)",
    filter: "blur(100px)",
    pointerEvents: "none",
    zIndex: 0,
  },

  /* BOTTOM RIGHT GLOW */
  secondaryGlow: {
    position: "fixed",
    bottom: "-300px",
    right: "-300px",
    width: "800px",
    height: "800px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle, rgba(168,85,247,0.18), transparent 65%)",
    filter: "blur(120px)",
    pointerEvents: "none",
    zIndex: 0,
  },

  /* SUBTLE GRID EFFECT */
  gridOverlay: {
    position: "fixed",
    inset: 0,
    backgroundImage:
      "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
    backgroundSize: "40px 40px",
    maskImage:
      "radial-gradient(circle at center, black 35%, transparent 90%)",
    pointerEvents: "none",
    zIndex: 1,
  },
};