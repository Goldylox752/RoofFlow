export const metadata = {
  title: "NorthSky RoofFlow OS",
  description: "Roofing operations management system",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "Arial, sans-serif" }}>
        {children}
      </body>
    </html>
  );
}