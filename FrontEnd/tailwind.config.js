/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts,css,scss,sass,less,styl}"],
  theme: {
    extend: {
      colors: {
        brand: {
          25: '#f2f7ff',
          50: '#ecf3ff',
          100: '#dde9ff',
          200: '#c2d6ff',
          300: '#9cb9ff',
          400: '#7592ff',
          500: '#465fff',
          600: '#3641f5',
          700: '#2a31d8',
          800: '#252dae',
          900: '#262e89',
          950: '#161950',
        },
      },
      fontFamily: {
        outfit: ['Outfit', 'sans-serif'],
      },
      fontSize: {
        'theme-sm': '14px',
        'theme-xl': '20px',
        'theme-xs': '12px',
      },
      zIndex: {
        1: '1',
        9: '9',
        99: '99',
        999: '999',
        9999: '9999',
        99999: '99999',
        999999: '999999',
      },
    },
  },
  plugins: [],
}
