import "./globals.css";

export const metadata = {
  title: "Flow OS — Build SaaS without backend complexity",
  description:
    "Flow OS is a modern AI-powered backend system for launching SaaS products, automations, and Stripe-ready apps in minutes.",
  keywords: [
    "saas backend",
    "stripe integration",
    "ai automation",
    "no-code backend",
    "startup tools",
  ],
  openGraph: {
    title: "Flow OS",
    description: "Launch SaaS products without backend complexity",
    url: "https://flowos.app",
    siteName: "Flow OS",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Optional performance + trust signals */}
        <meta name="theme-color" content="#0b0f17" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body style={styles.body}>
        {/* GLOBAL BACKGROUND LAYER (adds premium SaaS feel) */}
        <div style={styles.bgGlow} />

        {/* APP CONTENT */}
        <div style={styles.container}>
          {children}
        </div>
      </body>
    </html>
  );
}

/* ================= STYLES (UPGRADED SAAS LOOK) ================= */

const styles = {
  body: {
    margin: 0,
    padding: 0,
    background: "#070b12",
    color: "#fff",
    fontFamily:
      "Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    overflowX: "hidden",
  },

  container: {
    position: "relative",
    zIndex: 2,
  },

  /* subtle glow background = premium SaaS feel */
  bgGlow: {
    position: "fixed",
    top: "-200px",
    left: "-200px",
    width: "600px",
    height: "600px",
    background: "radial-gradient(circle, rgba(79,124,255,0.25), transparent 60%)",
    filter: "blur(80px)",
    zIndex: 0,
    pointerEvents: "none",
  },
};