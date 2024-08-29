

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
     "./index.html",
     "./src/**/*.{html,js}"],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}