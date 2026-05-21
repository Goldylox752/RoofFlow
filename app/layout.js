export const metadata = {
  title: "NorthSky",
  description: "AI-driven lead automation platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={styles.body}>
        {children}
      </body>
    </html>
  );
}

const styles = {
  body: {
    margin: 0,
    background: "#000",
    color: "#fff",
    fontFamily: "system-ui, sans-serif",
  },
};