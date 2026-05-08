import type { ReactNode } from "react";

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>RoofFlow AI</title>
        <meta
          name="description"
          content="AI-powered roofing and HVAC lead generation system"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>

      <body
        style={{
          margin: 0,
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
          backgroundColor: "#0b0f19",
          color: "white",
        }}
      >
        {children}
      </body>
    </html>
  );
}