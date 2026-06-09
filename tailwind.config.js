/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        felt: {
          900: '#0a1f0f',
          800: '#0d2a14',
          700: '#0d4a1f',
          600: '#166534',
        },
        gold: {
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        chip: {
          red: '#dc2626',
          blue: '#1d4ed8',
          black: '#1f2937',
        },
      },
      fontFamily: {
        casino: ['Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}
