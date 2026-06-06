/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e3a8a',
          900: '#1e3a8a',
          950: '#172554',
        },
        safety: {
          warning: '#EAB308',
          danger: '#DC2626',
          success: '#16A34A',
          info: '#EA580C',
        },
        industrial: {
          bg: '#0F172A',
          panel: '#1E293B',
          border: '#334155',
          text: '#E2E8F0',
          muted: '#94A3B8',
        }
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'alarm': 'alarm 1s ease-in-out infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-20px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        alarm: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(220, 38, 38, 0.7)' },
          '50%': { boxShadow: '0 0 0 20px rgba(220, 38, 38, 0)' },
        },
      },
    },
  },
  plugins: [],
};
