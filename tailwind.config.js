/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        imperial: {
          gold: '#C9A227',
          green: '#1E5631',
          cream: '#F5F0E6',
          brown: '#5E412F',
        },
        background: '#FAF8F3',
        text: '#1A1A1A',
      },
    },
  },
  plugins: [],
}
