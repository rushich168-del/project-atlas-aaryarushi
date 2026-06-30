/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#0F172A',
        accentBlue: '#2563EB',
        accentTeal: '#14B8A6',
        slateText: '#334155',
        lightBg: '#F8FAFC',
      },
      boxShadow: {
        soft: '0 18px 60px rgba(15, 23, 42, 0.09)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'Segoe UI', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
