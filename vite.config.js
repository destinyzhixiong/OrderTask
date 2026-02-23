import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        // 开发环境：如果是本地开发，使用localhost；如果是服务器，可以配置环境变量
        target: process.env.VITE_API_URL || 'http://43.128.226.215:5000',
        changeOrigin: true,
        timeout: 30000, // 30秒超时
        proxyTimeout: 30000
      }
    }
  }
})

