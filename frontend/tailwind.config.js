/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef6ff',
          100: '#d9eaff',
          200: '#bcd9ff',
          300: '#8ec0ff',
          400: '#599eff',
          500: '#327cfa',
          600: '#1b5ff0',
          700: '#154ad9',
          800: '#173dae',
          900: '#183689',
          950: '#102254',
        }
      }
    },
  },
  plugins: [],
}
