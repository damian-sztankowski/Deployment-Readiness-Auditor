/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          750: '#263348',
          850: '#11192a',
          925: '#0b111e',
          950: '#060a12'
        },
        sapphire: {
          50: '#eff6ff',
          100: '#dbeafe',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#2563eb',
          700: '#1d4ed8'
        }
      },
      boxShadow: {
        '3xl': '0 24px 48px -12px rgba(4, 9, 20, 0.35)',
        'studio': '0 1px 2px rgba(15, 23, 42, 0.06), 0 12px 32px -8px rgba(15, 23, 42, 0.12)'
      },
      animation: {
        'spin-slow': 'spin-slow 14s linear infinite',
        'gradient': 'gradient 8s linear infinite',
        'logo-pulse': 'logo-pulse 4s ease-in-out infinite',
        'float': 'float 3.5s ease-in-out infinite',
        'float-orbit-1': 'float-orbit-1 8s ease-in-out infinite',
        'float-orbit-2': 'float-orbit-2 10s ease-in-out infinite',
        'wiggle': 'wiggle 3s ease-in-out infinite',
        'morph': 'morph 9s ease-in-out infinite',
        'morph-fast': 'morph 4s ease-in-out infinite'
      },
      backgroundSize: {
        '300%': '300% auto'
      },
      screens: {
        '3xl': '1920px',
        '4xl': '2560px'
      }
    }
  },
  plugins: []
};
