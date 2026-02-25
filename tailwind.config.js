/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        citrus: {
          green: '#2e8b57',
          yellow: '#ffdc3a',
          orange: '#ff9871',
          cream: '#fdfbf7',
        }
      }
    }
  },
  plugins: []
}
