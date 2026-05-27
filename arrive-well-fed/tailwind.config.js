/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Diner-menu palette — warm + slightly retro (per SPEC §5)
        cream: '#fdf6e3',
        butter: '#f5d68a',
        tomato: '#d94f3a',
        ketchup: '#a82d1d',
        mustard: '#c98c25',
        olive: '#4a5d2f',
        ink: '#2b2118',
      },
      fontFamily: {
        display: ['"Bree Serif"', 'Georgia', 'serif'],
        body: ['"Inter"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -20px rgba(43,33,24,0.45)',
      },
    },
  },
  plugins: [],
};
