import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // 生产构建时自动移除 console.log / console.warn
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : []
  }
})
