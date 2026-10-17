/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0284c7', // Main Light Blue
          600: '#0369a1',
          700: '#075985',
          800: '#0c4a6e',
          900: '#0f172a', // Navy Text
          950: '#020617',
        },
        surface: {
          light: '#ffffff',
          subtle: '#f8fafc',
          muted: '#f1f5f9',
          border: '#e2e8f0'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(2, 132, 199, 0.08)',
        '3d': '0 20px 25px -5px rgba(15, 23, 42, 0.1), 0 10px 10px -5px rgba(15, 23, 42, 0.04)',
        '3d-hover': '0 30px 40px -10px rgba(2, 132, 199, 0.25), 0 15px 15px -5px rgba(2, 132, 199, 0.15)',
      }
    },
  },
  plugins: [],
}
