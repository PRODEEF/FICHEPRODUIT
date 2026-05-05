/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        purple: {
          50: '#faf5ff',
          100: '#f3e8ff',
          300: '#c084fc',
          400: '#a855f7',
          500: '#9333ea',
          600: '#7c3aed',
          700: '#6d28d9',
        },
        red: {
          500: '#ef4444',
        },
        text: {
          primary: '#111827',
          secondary: '#4b5563',
          muted: '#6b7280',
          light: '#9ca3af',
        },
        bg: {
          main: '#f3f4f6',
          white: '#ffffff',
        },
        soft: '#f3e8ff',
        border: {
          DEFAULT: '#e5e7eb',
          purple: 'rgba(139, 92, 246, 0.2)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
