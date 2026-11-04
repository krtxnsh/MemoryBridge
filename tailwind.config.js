/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#F36B32',
          hover: '#D95424',
          text: '#B8431A',
          light: '#FFF0E7',
          50: '#FFF7F2',
          100: '#FFF0E7',
          200: '#FED7C3',
          300: '#FCB595',
          400: '#F88A58',
          500: '#F36B32',
          600: '#D95424',
          700: '#B8431A',
        },
        warm: {
          white: '#FFFDF9',
          cream: '#F8F1E8',
          peach: '#FDEEE4',
          sky: '#EBF4F6',
          yellow: '#FEF8E7',
          sand: '#EFE7DC',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          card: '#FFFDF9',
          muted: '#F8F4EE',
          border: '#E9E3DC',
        },
        ink: {
          primary: '#292521',
          secondary: '#77716B',
          muted: '#A29C95',
        },
        status: {
          success: '#327A55',
          amber: '#D97706',
          info: '#2563EB',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 4px 20px -2px rgba(41, 37, 33, 0.05), 0 2px 6px -1px rgba(41, 37, 33, 0.03)',
        'soft-md': '0 8px 30px -4px rgba(243, 107, 50, 0.08), 0 4px 12px -2px rgba(41, 37, 33, 0.04)',
        'soft-lg': '0 16px 40px -6px rgba(243, 107, 50, 0.12), 0 8px 20px -4px rgba(41, 37, 33, 0.06)',
        'clay': 'inset 0 2px 4px 0 rgba(255, 255, 255, 0.8), 0 10px 25px -5px rgba(217, 84, 36, 0.15)',
        'book': '2px 8px 24px rgba(41, 37, 33, 0.12), 0 2px 6px rgba(41, 37, 33, 0.08)',
      },
      borderRadius: {
        '3xl': '1.75rem',
        '4xl': '2.25rem',
      }
    },
  },
  plugins: [],
}
