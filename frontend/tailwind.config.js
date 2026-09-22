/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#E6410A",
          dark: "#B93408",
          light: "#F2703F",
        },
        secondary: {
          DEFAULT: "#0B3D29",
          light: "#145C3D",
        },
        surface: {
          DEFAULT: "#FFFFFF",
          alt: "#F1F5F2",
        },
        bg: "#FBFAF8",
        ink: {
          DEFAULT: "#16211C",
          muted: "#5C6B63",
        },
        border: "#E1E7E2",
        success: "#2E7D50",
        warning: "#B8791A",
        danger: "#C1272D",
      },
      fontFamily: {
        display: ["'Baloo 2'", "'Noto Sans Devanagari'", "sans-serif"],
        body: ["'Hind'", "'Noto Sans Devanagari'", "sans-serif"],
      },
      borderRadius: {
        card: "0.875rem",
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 61, 41, 0.06), 0 1px 3px rgba(11, 61, 41, 0.08)",
      },
    },
  },
  plugins: [],
};
