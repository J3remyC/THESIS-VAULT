/** @type {import('tailwindcss').config} */

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#a1191b',
          600: '#8e1618',
          700: '#7b1315',
        },
      },
    },
  },
  plugins: [],
}