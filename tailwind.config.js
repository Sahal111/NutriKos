/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#16A34A', dark: '#166534', deeper: '#14532d', light: '#dcfce7', mint: '#86efac' },
        accent: { DEFAULT: '#F59E0B', light: '#fef3c7' },
        surface: '#f7f9fb',
      },
      fontFamily: { sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
