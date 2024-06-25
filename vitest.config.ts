import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom', // 使用 happy-dom 模拟浏览器环境
  },
})
