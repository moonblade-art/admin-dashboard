/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#3E5F44',
          50: '#E8EFEA',
          100: '#D1DFD6',
          200: '#A3BFAE',
          300: '#759F86',
          400: '#5C8C6D',
          500: '#3E5F44',
          600: '#324C37',
          700: '#263929',
          800: '#1A261C',
          900: '#0E130E',
        },
        secondary: {
          DEFAULT: '#6C8C73',
          50: '#EDF1EE',
          100: '#DBE3DD',
          200: '#B7C7BB',
          300: '#93AB99',
          400: '#6C8C73',
          500: '#5A7560',
          600: '#485E4D',
          700: '#36473A',
          800: '#243027',
          900: '#121815',
        },
        third: {
          DEFAULT: '#BCA88D',
          50: '#F5F2EE',
          100: '#EBE5DD',
          200: '#D7CCBC',
          300: '#C3B29B',
          400: '#BCA88D',
          500: '#A08B6E',
          600: '#847058',
          700: '#685642',
          800: '#4C3C2C',
          900: '#302216',
        },
        background: {
          DEFAULT: '#F3F5F2',
        },
        text: {
          primary: '#1E1E1E',
          secondary: '#5C6D5D',
        },
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(62, 95, 68, 0.1)',
        'soft-lg': '0 10px 40px -4px rgba(62, 95, 68, 0.15)',
      },
    },
  },
  plugins: [],
}