/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'mulish': ['Mulish', 'sans-serif'],
        'sans': ['Mulish', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Modern blue palette from design
        primary: {
          50: '#E2F1FF',
          100: '#DCEFFF',
          200: '#E7F5FF', 
          300: '#3EA2FF',
          400: '#0A82F1',
          500: '#270BD6',
          600: '#2C10D7',
          700: '#3117D9',
          800: '#200E32',
          900: '#230B34',
        },
        // Success colors
        success: {
          400: '#21D91D',
          500: '#0ED00A',
        },
        // Warning/accent colors  
        warning: {
          400: '#FF60D2',
          500: '#FD9468',
        },
        // Neutral grays
        neutral: {
          50: '#FFFFFF',
          100: '#F6F4FF',
          200: '#DCD8EB',
          300: '#DADADA',
          400: '#9B9EAA',
          500: '#9198B1',
          600: '#707585',
          700: '#626262',
          800: '#3F3F3F',
          900: '#010925',
        },
        // Background colors
        background: {
          DEFAULT: '#E2F1FF',
          secondary: '#DCEFFF',
          card: '#FFFFFF',
        },
        // Legacy compatibility
        accent: {
          500: '#270BD6',
          600: '#3117D9'
        },
        surface: {
          50: '#fafbfc',
          100: '#f3f6f9',
          200: '#eef2f6'
        },
        muted: {
          400: '#9B9EAA',
          600: '#626262'
        }
      },
      spacing: {
        18: '4.5rem',
        22: '5.5rem'
      },
      borderRadius: {
        'xl': '16px',
        '2xl': '24px',
        '3xl': '32px',
        '4xl': '34px',
      },
      boxShadow: {
        'card': '0px 25px 50px 16px rgba(210, 210, 210, 0.25)',
        'payment': '0px 33px 25px rgba(210, 210, 210, 0.25)',
        'soft': '0px 16px 25px rgba(202, 202, 202, 0.25)',
      },
      fontSize: {
        'xs': ['11.9px', '15px'],
        'sm': ['13.6px', '17px'], 
        'base': ['15.3px', '19px'],
        'lg': ['17px', '21px'],
        'xl': ['18.7px', '23px'],
        '2xl': ['20.4px', '26px'],
        '3xl': ['22.1px', '28px'],
        '4xl': ['23.8px', '30px'],
        '5xl': ['28.9px', '36px'],
      }
    },
  },
  plugins: [],
}