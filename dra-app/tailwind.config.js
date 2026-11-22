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
          750: '#2d3748',
          850: '#1a202c',
          950: '#020617'
        }
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.3)'
      },
      animation: {
        'spin-slow': 'spin-slow 12s linear infinite',
        'gradient': 'gradient 8s linear infinite',
        'logo-pulse': 'logo-pulse 4s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float-slow 6s ease-in-out infinite',
        'float-orbit-1': 'float-orbit-1 8s ease-in-out infinite',
        'float-orbit-2': 'float-orbit-2 10s ease-in-out infinite',
        'wiggle': 'wiggle 2s ease-in-out infinite',
        'blob': 'blob 7s infinite',
        'morph': 'morph 8s ease-in-out infinite',
        'morph-fast': 'morph 3s ease-in-out infinite'
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
