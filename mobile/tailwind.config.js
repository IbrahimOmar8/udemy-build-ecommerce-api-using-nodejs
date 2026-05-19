/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          500: '#3a60ff',
          600: '#243df5',
          700: '#1b2ed8',
          900: '#1c2a89',
        },
      },
    },
  },
  plugins: [],
};
