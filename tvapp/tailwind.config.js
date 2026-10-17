/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        rba: {
          dark: '#071224',
          navy: '#0b1e36',
          navyLight: '#142a4a',
          blue: '#0284c7',
          blueHover: '#0369a1',
          blueLight: '#e0f2fe',
          yellow: '#f59e0b',
          gold: '#eab308',
          green: '#10b981',
          red: '#ef4444',
          grayBg: '#f8fafc',
          border: '#e2e8f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      animation: {
        'pulse-subtle': 'pulse 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'equalizer': 'equalize 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        equalize: {
          '0%': { height: '20%' },
          '50%': { height: '100%' },
          '100%': { height: '35%' },
        }
      }
    },
  },
  plugins: [],
}
