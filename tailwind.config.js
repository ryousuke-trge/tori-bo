/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          '"Yomogi"',
          '"Zen Kaku Gothic New"',
          '"SF Pro Text"', 
          '"SF Pro Display"', 
          '"SF Pro"', 
          '-apple-system', 
          'BlinkMacSystemFont', 
          '"Helvetica Neue"', 
          'Arial', 
          'sans-serif'
        ],
      },
    },
  },
  plugins: [],
}

