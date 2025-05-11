/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e6ffe6',
          100: '#ccffcc',
          200: '#99ff99',
          300: '#66ff66',
          400: '#33ff33',
          500: '#00cc00',
          600: '#006600', // INL Primary Color
          700: '#004d00',
          800: '#003300',
          900: '#001a00',
          950: '#000d00',
        },
        secondary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#b9e6fe',
          300: '#7cd4fd',
          400: '#36bffa',
          500: '#0ca6eb',
          600: '#0083c9',
          700: '#0165a3',
          800: '#065486',
          900: '#0b4871',
          950: '#082c4a',
        },
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgb(0 0 0 / 0.10)',
      },
    },
  },
  plugins: [],
};