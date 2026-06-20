/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#e6f7f6',
          100: '#ccefed',
          200: '#99dfdb',
          300: '#66cfc9',
          400: '#33bfb7',
          500: '#2d9b8f',
          600: '#26756b',
          700: '#1a4d47',
          800: '#133a36',
          900: '#0d2b28',
        },
        accent: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#fed7aa',
          300: '#fdba74',
          400: '#fd9344',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
          800: '#9a3412',
          900: '#7c2d12',
        },
      },
    },
  },
  plugins: [],
};
