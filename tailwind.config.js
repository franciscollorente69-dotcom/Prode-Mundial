/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        argentina: {
          blue: '#74ACDF',
          white: '#FFFFFF',
          green: '#075e38',
        },
        mundial: {
          green: '#075e38',
          lightgreen: '#1a7a4a',
          gold: '#c9a84c',
          darkbg: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-subtle': 'bounce 2s infinite',
      }
    },
  },
  plugins: [],
}
