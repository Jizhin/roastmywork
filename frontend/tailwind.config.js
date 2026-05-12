/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'Geist', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      colors: {
        dark: {
          bg:       '#09090b',
          surface:  '#111115',
          surface2: '#18181c',
          surface3: '#1e1e24',
          border:   'rgba(255,255,255,0.07)',
          text:     '#f4f4f5',
          text2:    '#a1a1aa',
          text3:    '#52525b',
          accent:   '#6366f1',
          accent2:  '#818cf8',
        },
      },
      maxWidth: {
        '8xl': '88rem',
      },
      animation: {
        'fade-up':   'fadeUp 0.4s ease-out both',
        'fade-in':   'fadeIn 0.25s ease-out both',
        'spin-slow': 'spin 1.5s linear infinite',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
