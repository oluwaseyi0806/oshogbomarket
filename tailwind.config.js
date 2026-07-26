/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Osogbo palette: indigo from local adire cloth, marigold-gold from Osun festival regalia
        indigo: {
          950: "#151C33", // near-black indigo, base background
          900: "#1E2A4A",
          700: "#2E4374",
          500: "#42619E",
        },
        gold: {
          500: "#E8A33D", // marigold accent
          400: "#F0B85C",
        },
        parchment: "#F6F1E7", // warm off-white, not cream-default
        clay: "#8C5A3C", // secondary earth accent, used sparingly
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
      },
    },
  },
  plugins: [],
};
