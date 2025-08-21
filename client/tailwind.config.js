/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          300: '#93c5fd',
          500: '#2563eb',
          600: '#1e40af',
        },
        accent: {
          500: '#2563eb',
          600: '#1e40af'
        },
        surface: {
          50: '#fafbfc',
          100: '#f3f6f9',
          200: '#eef2f6'
        },
        muted: {
          400: '#9ca3af',
          600: '#6b7280'
        }
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      }
    },
  },
  plugins: [],
}