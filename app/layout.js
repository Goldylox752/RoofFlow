import { ClerkProvider } from "@clerk/nextjs";

export const metadata = {
  title: "NorthSky RoofFlow OS",
  description: "Roofing workflow & operations platform",
};

export default function RootLayout({ children }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>

          <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>

            <header
              style={{
                padding: "12px 20px",
                borderBottom: "1px solid #eee",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontWeight: 600,
              }}
            >
              <span>NorthSky RoofFlow</span>
            </header>

            <main style={{ flex: 1, padding: "20px" }}>
              {children}
            </main>

            <footer
              style={{
                padding: "12px 20px",
                borderTop: "1px solid #eee",
                textAlign: "center",
                fontSize: "12px",
                color: "#666",
              }}
            >
              © {new Date().getFullYear()} NorthSky RoofFlow OS
            </footer>

          </div>

        </body>
      </html>
    </ClerkProvider>
  );
}