import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/NeonSnake/',
  server: {
    port: 3333,
    open: true
  }
})