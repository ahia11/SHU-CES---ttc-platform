// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cesium from 'vite-plugin-cesium' // 导入插件

export default defineConfig({
  plugins: [
    vue(),
    cesium() // 使用插件
  ],

  // ⬇️ ----------------- ⬇️
  //     添加下面这个 server 块
  server: {
    allowedHosts: [
      // 允许所有 .trycloudflare.com 结尾的域名
      '.trycloudflare.com'
    ]
  }
  // ⬆️ ----------------- ⬆️
})