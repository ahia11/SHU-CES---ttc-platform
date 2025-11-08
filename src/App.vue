<template>
  <div class="app-container" :class="{ 'sidebar-collapsed': isCollapsed }">
    <Sidebar :is-collapsed="isCollapsed" @toggle="toggleSidebar" />

    <main class="content-view">
      <router-view v-slot="{ Component }">
        <transition name="fade-slide" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
    </main>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from './components/Sidebar.vue'

// 1. 创建一个 ref 来追踪侧边栏的折叠状态
const isCollapsed = ref(false)

// 2. 创建一个函数来切换这个状态
function toggleSidebar() {
  isCollapsed.value = !isCollapsed.value
}
</script>

<style scoped>
.app-container {
  display: flex;
  width: 100vw;
  height: 100vh;
}

.content-view {
  flex: 1;
  padding: 2rem;
  overflow-y: auto; /* 内容区可滚动 */
  height: 100vh;
  
  /* 使用 var() 来动态设置 margin-left
    --sidebar-width 必须在你的全局 CSS 中定义
  */
  margin-left: var(--sidebar-width);
  
  /* 添加过渡效果 */
  transition: margin-left 0.3s ease;
}

/* 当 .app-container 有 .sidebar-collapsed 类时,
  修改 .content-view 的 margin-left
*/
.app-container.sidebar-collapsed .content-view {
  margin-left: var(--sidebar-width-collapsed);
}

/* 路由切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.3s ease-out;
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>