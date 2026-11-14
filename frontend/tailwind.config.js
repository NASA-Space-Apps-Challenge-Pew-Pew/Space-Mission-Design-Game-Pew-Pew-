/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        space: {
          950: "#060913",
          900: "#0c1222",
          800: "#162038",
          700: "#223154",
        },
      },
    },
  },
  plugins: [],
}
