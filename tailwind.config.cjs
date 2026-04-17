/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        panel: '#111827',
        muted: '#1f2937',
        accent: '#22c55e',
        accentAlt: '#ef4444',
      },
      boxShadow: {
        soft: '0 10px 40px rgba(2, 6, 23, 0.35)',
      },
    },
  },
  plugins: [],
};
