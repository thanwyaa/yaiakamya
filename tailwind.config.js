/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        neon: { blue: '#00D2FF', purple: '#A855F7', cyan: '#06B6D4', pink: '#EC4899' },
        dark: { 50: '#1A1A2E', 100: '#15152A', 200: '#0F0F23', 300: '#0A0A1A', 400: '#060610', 500: '#03030A' }
      },
      fontFamily: { cairo: ['Cairo', 'sans-serif'] },
      animation: { 'glow': 'glow 2s ease-in-out infinite', 'float': 'float 3s ease-in-out infinite' },
      keyframes: {
        glow: { '0%,100%': { textShadow: '0 0 20px #00D2FF' }, '50%': { textShadow: '0 0 40px #A855F7' } },
        float: { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-20px)' } }
      }
    }
  },
  plugins: [],
}
