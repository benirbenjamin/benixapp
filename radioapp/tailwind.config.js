/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        station: {
          primary: 'var(--primary-color, #4F46E5)',
          secondary: 'var(--secondary-color, #06B6D4)',
          accent: 'var(--accent-color, #F59E0B)',
          bg: 'var(--background-color, #FFFFFF)',
          surface: 'var(--surface-color, #F8FAFC)',
          text: 'var(--text-color, #0F172A)',
          muted: 'var(--muted-color, #64748B)',
          header: 'var(--header-color, #FFFFFF)',
          footer: 'var(--footer-color, #0F172A)',
        }
      },
      fontFamily: {
        station: ['var(--station-font, Inter)', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'wave': 'wave 1.2s ease-in-out infinite alternate',
      },
      keyframes: {
        wave: {
          '0%': { height: '20%' },
          '100%': { height: '100%' },
        }
      }
    },
  },
  plugins: [],
}
