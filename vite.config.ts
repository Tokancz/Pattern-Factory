import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from "path"

export default defineConfig({
  base: "/Pattern-Factory/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/styles/tokens" as *;`
      }
    }
  },
  // ADD THIS:
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true
      }
    }
  }
})