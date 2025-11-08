// src/router/index.js

import { createRouter, createWebHistory } from 'vue-router'
// 导入新主页
import Home from '../views/Home.vue' // <--- 1. 添加这一行来导入 Home 组件

// 1. 移除数字，使用清晰的功能命名
import PageExplorer from '../views/PageExplorer.vue'
import PageStructure from '../views/PageStructure.vue'
import PageSpatial from '../views/PageSpatial.vue'
import PageCausal from '../views/PageCausal.vue'

const routes = [
  {
    // 1. 新的主页
    path: '/',
    name: 'Home',
    component: Home, // <--- 2. 现在 'Home' 已经被正确导入了
  },
  {
    path: '/explorer',
    name: 'DataExplorer',
    component: PageExplorer, // 对应 PageExplorer.vue
  },
  {
    path: '/structure', // (来自步骤一)
    name: 'Structure',  // (来自步骤一)
    component: PageStructure, // 对应 PageStructure.vue
  },
  {
    path: '/spatial',
    name: 'Spatial',
    component: PageSpatial, // 对应 PageSpatial.vue
  },
  {
    path: '/causal',
    name: 'Causal',
    component: PageCausal, // 对应 PageCausal.vue
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router