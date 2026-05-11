/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        certia: {
          green: '#1A6B3C',
          'green-light': '#2a8a50',
          'green-dark': '#115028',
          gold: '#C8A84B',
          'gold-light': '#d4b96a',
          'gold-dark': '#a88930',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
