/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: '#0f172a',
        'surface-card': 'rgba(17, 24, 39, 0.75)',
        'surface-border': 'rgba(255, 255, 255, 0.08)',
        accent: {
          cyan: '#00f2fe',
          blue: '#4facfe',
          violet: '#8a2be2',
          purple: '#a855f7',
          emerald: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
        }
      },
      boxShadow: {
        'neon-cyan': '0 0 20px rgba(0, 242, 254, 0.25)',
        'neon-violet': '0 0 25px rgba(138, 43, 226, 0.25)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(0, 242, 254, 0.2)' },
          '100%': { boxShadow: '0 0 20px rgba(0, 242, 254, 0.6)' }
        }
      }
    },
  },
  plugins: [],
}
