export const metadata = {
  title: "NorthSky RoofFlow OS",
  description: "Roofing workflow & operations platform",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          
          <header style={{ padding: "12px 20px", borderBottom: "1px solid #eee" }}>
            NorthSky RoofFlow
          </header>

          <main style={{ flex: 1, padding: "20px" }}>
            {children}
          </main>

          <footer style={{ padding: "12px 20px", borderTop: "1px solid #eee" }}>
            © {new Date().getFullYear()} NorthSky
          </footer>

        </div>
      </body>
    </html>
  );
}