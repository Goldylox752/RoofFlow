import Link from "next/link";

function formatCity(slug = "") {
  return slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

/* =========================
   SEO METADATA
========================= */
export async function generateMetadata({ params }) {
  const city = params?.city ? formatCity(params.city) : "Your City";

  return {
    title: `Roofing Leads in ${city} | RoofFlow`,
    description: `Exclusive roofing leads in ${city}. RoofFlow connects contractors with high-intent homeowners ready to book estimates.`,

    openGraph: {
      title: `Roofing Leads in ${city}`,
      description: `Exclusive roofing leads for contractors in ${city}.`,
      type: "website",
    },
  };
}

/* =========================
   PAGE
========================= */
export default function CityPage({ params }) {
  const city = params?.city ? formatCity(params.city) : "Your City";

  return (
    <main style={styles.main}>
      <div style={styles.container}>

        {/* HERO */}
        <header style={styles.hero}>
          <h1 style={styles.h1}>
            Exclusive Roofing Leads in {city}
          </h1>

          <p style={styles.subtext}>
            RoofFlow connects contractors in <b>{city}</b> with high-intent homeowners
            actively requesting roofing estimates. No shared leads. No recycled data.
          </p>

          <Link href="/apply" style={styles.primaryButton}>
            Apply for {city} Access →
          </Link>

          <div style={styles.trustBar}>
            Exclusive territories • Verified homeowners • Real-time delivery
          </div>
        </header>

        {/* VALUE */}
        <section style={styles.section}>
          <h2>Why Contractors Choose RoofFlow in {city}</h2>
          <p style={styles.text}>
            Traditional lead providers distribute the same inquiry to multiple contractors.
            RoofFlow assigns leads exclusively to one approved contractor.
          </p>
        </section>

        {/* HOW IT WORKS */}
        <section style={styles.section}>
          <h2>How It Works</h2>
          <ul style={styles.list}>
            <li>Homeowners in {city} request roofing estimates</li>
            <li>Our system filters intent and urgency</li>
            <li>Qualified leads are assigned to one contractor</li>
          </ul>
        </section>

        {/* VALUE STACK */}
        <section style={styles.section}>
          <h2>What You Get</h2>
          <ul style={styles.list}>
            <li>Exclusive contractor territory in {city}</li>
            <li>No shared or recycled leads</li>
            <li>High-intent homeowner pipeline</li>
            <li>Instant lead delivery system</li>
          </ul>
        </section>

        {/* URGENCY */}
        <div style={styles.urgency}>
          Limited contractor availability in {city}
        </div>

        {/* FINAL CTA */}
        <section style={styles.finalCta}>
          <h2>Start Receiving Leads in {city}</h2>

          <p style={styles.text}>
            Applications are reviewed to maintain lead quality and exclusivity in each market.
          </p>

          <Link href="/apply" style={styles.primaryButton}>
            Apply Now →
          </Link>
        </section>

      </div>
    </main>
  );
}

/* =========================
   STYLES
========================= */
const styles = {
  main: {
    background: "#070d18",
    color: "white",
    fontFamily: "system-ui",
    padding: "70px 20px",
  },

  container: {
    maxWidth: "900px",
    margin: "0 auto",
  },

  hero: {
    marginBottom: "50px",
  },

  h1: {
    fontSize: "44px",
    fontWeight: 800,
    marginBottom: "16px",
  },

  subtext: {
    opacity: 0.85,
    fontSize: "18px",
    lineHeight: "1.6",
    marginBottom: "25px",
  },

  primaryButton: {
    display: "inline-block",
    padding: "14px 20px",
    background: "#3b82f6",
    color: "white",
    borderRadius: "10px",
    fontWeight: 700,
    textDecoration: "none",
  },

  trustBar: {
    fontSize: "13px",
    opacity: 0.7,
    marginTop: "12px",
  },

  section: {
    marginTop: "45px",
  },

  text: {
    opacity: 0.85,
    lineHeight: "1.7",
  },

  list: {
    opacity: 0.85,
    lineHeight: "1.9",
  },

  urgency: {
    marginTop: "45px",
    padding: "16px",
    background: "#111b2e",
    borderRadius: "10px",
    textAlign: "center",
    fontWeight: 700,
  },

  finalCta: {
    marginTop: "70px",
    textAlign: "center",
  },
};