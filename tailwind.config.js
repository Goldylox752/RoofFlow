/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
  ],

  theme: {
    extend: {
      colors: {
        background: "#050816",
        foreground: "#ffffff",
        primary: "#6366f1",
        secondary: "#8b5cf6",
      },

      borderRadius: {
        xl: "16px",
        "2xl": "24px",
      },

      boxShadow: {
        glow: "0 0 80px rgba(99,102,241,0.15)",
      },

      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },

  plugins: [],
};