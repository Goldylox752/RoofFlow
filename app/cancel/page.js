export default function CheckoutCancelPage() {
  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <div style={styles.icon}>❌</div>

        <h1 style={styles.title}>Checkout Cancelled</h1>

        <p style={styles.text}>
          Your payment was not completed.
          No charges were made to your account.
        </p>

        <div style={styles.actions}>
          <a href="/buy" style={styles.primaryButton}>
            Try Again
          </a>

          <a href="/" style={styles.secondaryButton}>
            Back Home
          </a>
        </div>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(to bottom, #0b0f17, #111827)",
    padding: 20,
    fontFamily: "Inter, system-ui, sans-serif",
  },

  card: {
    width: "100%",
    maxWidth: 520,
    background: "rgba(17,24,39,0.92)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 24,
    padding: 40,
    textAlign: "center",
    backdropFilter: "blur(12px)",
  },

  icon: {
    fontSize: 70,
    marginBottom: 20,
  },

  title: {
    color: "#fff",
    fontSize: 42,
    fontWeight: 800,
    marginBottom: 18,
  },

  text: {
    color: "#9ca3af",
    fontSize: 18,
    lineHeight: 1.7,
    marginBottom: 32,
  },

  actions: {
    display: "flex",
    gap: 14,
    justifyContent: "center",
    flexWrap: "wrap",
  },

  primaryButton: {
    background: "#2563eb",
    color: "#fff",
    textDecoration: "none",
    padding: "14px 24px",
    borderRadius: 12,
    fontWeight: 700,
  },

  secondaryButton: {
    border: "1px solid rgba(255,255,255,0.12)",
    color: "#fff",
    textDecoration: "none",
    padding: "14px 24px",
    borderRadius: 12,
    fontWeight: 700,
  },
};