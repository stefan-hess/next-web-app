/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      keyframes: {
        gradientShift: {
          '0%': { 'background-position': '0% 50%' },
          '50%': { 'background-position': '100% 50%' },
          '100%': { 'background-position': '0% 50%' },
        },
        blob1: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '33%': { transform: 'translateY(-20px) scale(1.15)' },
          '66%': { transform: 'translateY(15px) scale(0.9)' },
        },
        blob2: {
          '0%, 100%': { transform: 'translateY(0) scale(1)' },
          '25%': { transform: 'translateY(10px) scale(1.09)' },
          '50%': { transform: 'translateY(-18px) scale(1.18)' },
          '75%': { transform: 'translateY(8px) scale(0.97)' },
        },
      },
      animation: {
        gradientShift: 'gradientShift 30s ease-in-out infinite',
        blob1: 'blob1 18s ease-in-out infinite',
        blob2: 'blob 22s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
