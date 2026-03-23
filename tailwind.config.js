/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: '#0f0f14',
          1: '#141420',
          2: '#1a1a28',
          3: '#20202f',
        },
        gold: {
          DEFAULT: '#e8c547',
          dim: 'rgba(232,197,71,0.12)',
          glow: 'rgba(232,197,71,0.35)',
        },
        teal: {
          DEFAULT: '#4ecca3',
          dim: 'rgba(78,204,163,0.12)',
        },
        coral: {
          DEFAULT: '#ff6b6b',
          dim: 'rgba(255,107,107,0.12)',
        },
        ink: {
          DEFAULT: '#e8e4dc',
          2: '#7a7060',
          3: '#3a342a',
        },
      },
      fontFamily: {
        sans: ['Syne', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderColor: {
        subtle: 'rgba(255,255,255,0.07)',
        medium: 'rgba(255,255,255,0.12)',
      },
    },
  },
  plugins: [],
}
