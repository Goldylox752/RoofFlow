// app/page.tsx
import HomeClient from "@/components/HomeClient";

export const metadata = {
  title: "Launch SaaS faster – Ready‑to‑use starter kit for founders",
  description: "Launch your SaaS in days, not months. Starter ($9/mo), Growth ($29/mo), Elite ($79/mo). Start building today.",
  robots: "index, follow",
  openGraph: {
    title: "Launch SaaS faster",
    description: "Get to market quickly with our battle‑tested boilerplate.",
    type: "website",
  },
};

export default function Page() {
  return <HomeClient />;
}