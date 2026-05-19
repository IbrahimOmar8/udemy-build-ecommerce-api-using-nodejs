import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dbe5ff',
          200: '#bccfff',
          300: '#8eafff',
          400: '#5d85ff',
          500: '#3a60ff',
          600: '#243df5',
          700: '#1b2ed8',
          800: '#1c2bae',
          900: '#1c2a89',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
