/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Arrive brand palette — semantic tokens kept; values remapped to Arrive system
        cream: '#F9F5F4',   // Arrive Off-White — primary light background
        butter: '#FFADE4',  // P4 Very Light Pink — soft accent / chef-note tint
        tomato: '#5F016F',  // P1 Deep Purple — primary CTA, brand accent
        ketchup: '#38003D', // Purple-900 — primary dark, hover, display headlines
        mustard: '#FF80D4', // P3 Light Pink — secondary accent / carbs in macro bar
        olive: '#8704AF',   // Purple-700 — tertiary / fat in macro bar
        ink: '#201E1D',     // Arrive Neutral-900
      },
      fontFamily: {
        display: ['"Urbanist"', '"DM Sans"', 'system-ui', 'sans-serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 24px 60px -20px rgba(56,0,61,0.35)',
      },
    },
  },
  plugins: [],
};
