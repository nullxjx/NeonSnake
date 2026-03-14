/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'game-bg': '#0a0a0f',
        'panel-bg': 'rgba(20, 20, 30, 0.9)',
        'neon-green': '#00ff88',
        'neon-blue': '#00ccff',
        'neon-purple': '#aa00ff',
        'neon-red': '#ff3366',
        'neon-yellow': '#ffcc00',
      },
      boxShadow: {
        'neon-green': '0 0 10px #00ff88, 0 0 20px #00ff88',
        'neon-blue': '0 0 10px #00ccff, 0 0 20px #00ccff',
        'neon-purple': '0 0 10px #aa00ff, 0 0 20px #aa00ff',
        'neon-red': '0 0 10px #ff3366, 0 0 20px #ff3366',
      },
      animation: {
        'pulse-glow': 'pulse-glow 2s ease-in-out infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}