export const metadata = {
  title: "NorthSky",
  description: "AI-driven lead automation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={styles.body}>
        <main id="app">{children}</main>
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    minHeight: "100vh",
    background: "#000",
    color: "#fff",
    fontFamily:
      "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    lineHeight: 1.5,
    overflowX: "hidden",
  },
};