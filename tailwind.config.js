/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        space: {
          dark: '#05070f',
          panel: '#0b1222',
          border: '#1e293b',
          accent: '#06b6d4',
          alert: '#ef4444',
          warning: '#f59e0b',
          success: '#10b981'
        }
      }
    },
  },
  plugins: [],
}
