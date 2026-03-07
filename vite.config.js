import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  esbuild: {
    // 构建时始终移除 console / debugger（开发服务器会忽略 esbuild.drop）
    drop: ['console', 'debugger']
  }
})
