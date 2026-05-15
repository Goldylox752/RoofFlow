import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "NorthSky AI",
  description:
    "Autonomous AI revenue system for lead generation, sales automation, and conversion optimization.",
  keywords: [
    "AI SaaS",
    "automation",
    "lead generation",
    "sales AI",
    "Stripe SaaS",
  ],
  openGraph: {
    title: "NorthSky AI",
    description:
      "Autonomous AI system that generates leads, closes deals, and drives revenue.",
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
      <body className="bg-black text-white antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}

/* ===============================
   APP SHELL (GLOBAL WRAPPER)
=============================== */
function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      {children}
    </div>
  );
}