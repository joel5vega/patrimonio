/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0d1117',
          card: '#161b22',
          teal: '#2dd4bf',
        },
      },
    },
  },
  plugins: [],
};
