<template>
  <nav class="sidebar" :class="{ 'is-collapsed': isCollapsed }">
    <div class="sidebar-header">
      
<router-link to="/" class="sidebar-logo">
        <span class="logo-icon">📊</span>
        <span class="logo-text" v-show="!isCollapsed">数据洞察</span>
      </router-link>
    </div>

    <ul class="nav-links">
      <li>
        <router-link to="/" class="nav-item">
          <span class="icon">🏠</span>
          <span class="link-text">网站首页</span>
        </router-link>
      </li>
      
      <li>
        <router-link to="/explorer" class="nav-item">
          <span class="icon">📊</span>
          <span class="link-text">数据探索</span>
        </router-link>
      </li>

      <li>
        <router-link to="/structure" class="nav-item"> <span class="icon">📈</span> <span class="link-text">结构变迁分析</span> </router-link>
      </li>
      
      <li>
        <router-link to="/spatial" class="nav-item">
          <span class="icon">🗺️</span>
          <span class="link-text">空间效应分析</span>
        </router-link>
      </li>

      <li>
        <router-link to="/causal" class="nav-item">
          <span class="icon">🔄</span>
          <span class="link-text">动态因果分析</span>
        </router-link>
      </li>
    </ul>

    
<button class="toggle-btn" @click="$emit('toggle')" :title="isCollapsed ? '展开侧边栏' : '收缩侧边栏'">
      <svg class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
    </button>
  </nav>
</template>
  
<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  isCollapsed: Boolean
})
defineEmits(['toggle'])
</script>
  
<style scoped>
/* 侧边栏整体布局和背景 */
.sidebar {
  position: fixed;
  top: 0;
  left: 0;
  width: var(--sidebar-width);
  height: 100vh;
  background-color: var(--sidebar-bg); 
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
  padding: 1.5rem 1rem; /* 调整内边距，左右稍小 */
  transition: width 0.3s ease, padding 0.3s ease;
  overflow-x: hidden; 
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.03);
  z-index: 1000; /* 确保侧边栏在最上层 */
}

/* 侧边栏头部 Logo 区域 */
.sidebar-header {
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: 1.5rem;
  text-align: center; /* 居中对齐 */
  transition: padding-bottom 0.3s ease, margin-bottom 0.3s ease;
}

.sidebar-logo {
  display: flex;
  align-items: center;
  justify-content: center; /* 默认居中 */
  text-decoration: none;
  color: var(--text-color);
  font-size: 1.5rem;
  font-weight: 700;
  white-space: nowrap;
  transition: all 0.3s ease;
}

.sidebar-logo .logo-icon {
  font-size: 1.8rem;
  margin-right: 0.5rem;
  color: var(--accent-color); /* Logo 图标颜色 */
  transition: margin-right 0.3s ease;
}

/* 折叠状态下的 Logo */
.sidebar.is-collapsed .sidebar-header {
  padding-bottom: 1rem;
  margin-bottom: 1rem;
}
.sidebar.is-collapsed .sidebar-logo .logo-icon {
  margin-right: 0; /* 图标居中 */
}


/* 导航链接容器 */
.nav-links {
  list-style: none;
  flex-grow: 1; /* 占据剩余空间 */
  padding: 0;
  margin-top: 0; /* 头部有了，这里不需要额外上边距 */
}
  
.nav-links li {
  margin-bottom: 0.5rem; /* 减小列表项间距 */
}
  
/* 单个导航链接样式 */
.nav-item { /* 从 a 改名为 nav-item，更语义化 */
  display: flex;
  align-items: center;
  white-space: nowrap; 
  padding: 0.75rem 0.75rem; /* 调整 padding */
  border-radius: 10px; /* 柔和的圆角 */
  color: var(--text-color);
  text-decoration: none;
  font-size: 0.95rem;
  font-weight: 500;
  transition: all 0.2s ease-in-out;
}

.nav-item .icon {
  font-size: 1.25rem; /* 调整图标大小 */
  margin-right: 0.75rem; /* 图标和文本的间距 */
  flex-shrink: 0;
  width: 1.25rem; /* 固定图标宽度，防止抖动 */
  text-align: center;
  color: var(--text-color-light); /* 图标默认颜色 */
  transition: margin-right 0.3s ease, color 0.2s ease;
}

.nav-item .link-text {
  opacity: 1;
  transition: opacity 0.2s ease;
}

/* 链接悬停效果 */
.nav-item:hover {
  background-color: rgba(0, 122, 255, 0.08); /* 更淡的蓝色悬停 */
  color: var(--text-color); /* 文本颜色不变 */
}
.nav-item:hover .icon {
  color: var(--accent-color); /* 悬停时图标变亮蓝 */
}
  
/* 激活链接样式 */
.nav-item.router-link-active {
  background: var(--accent-color); /* Apple 蓝 */
  color: #ffffff; /* 白色文本 */
  font-weight: 600;
  box-shadow: 0 4px 15px -5px rgba(0, 122, 255, 0.4);
}
.nav-item.router-link-active .icon {
  color: #ffffff; /* 激活时图标也变白 */
}


/* --- 折叠按钮样式 --- */
.toggle-btn {
  position: absolute;
  bottom: 1.5rem; /* 调整到底部 */
  left: 50%;
  transform: translateX(-50%); /* 水平居中 */
  background: #f0f0f0; 
  border: none;
  color: var(--text-color-light); 
  border-radius: 50%;
  width: 32px; /* 稍大一点 */
  height: 32px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08); /* 增加一点阴影 */
}

.toggle-btn:hover {
  background: var(--accent-color);
  color: #ffffff;
  box-shadow: 0 4px 12px rgba(0, 122, 255, 0.3); /* 悬停时阴影更明显 */
}

/* SVG 图标样式 */
.toggle-icon {
  width: 18px;
  height: 18px;
  transform: rotate(0deg); /* 默认不旋转 */
  transition: transform 0.3s ease;
}

/* 折叠状态下的按钮和图标 */
.sidebar.is-collapsed .toggle-btn {
  transform: translateX(-50%) rotate(180deg); /* 按钮居中，图标旋转 */
}


/* --- 折叠状态下的侧边栏样式 --- */
.sidebar.is-collapsed {
  width: var(--sidebar-width-collapsed);
  padding: 1.5rem 0.5rem; /* 折叠时左右内边距更小 */
}

/* 折叠时，链接文本消失 */
.sidebar.is-collapsed .nav-item .link-text {
  opacity: 0;
  width: 0; /* 宽度也设为0，防止占用空间 */
  overflow: hidden;
  pointer-events: none;
}

/* 折叠时，图标居中 */
.sidebar.is-collapsed .nav-item {
  justify-content: center;
  padding: 0.75rem 0.5rem; /* 折叠时 padding 居中 */
}
.sidebar.is-collapsed .nav-item .icon {
  margin-right: 0; 
  font-size: 1.5rem; /* 折叠时图标可以更大一些 */
  width: auto; /* 恢复自动宽度 */
  color: var(--text-color); /* 折叠时图标颜色恢复 */
}

/* 折叠时，激活状态图标颜色 */
.sidebar.is-collapsed .nav-item.router-link-active .icon {
  color: #ffffff; /* 激活时图标变白 */
}
</style>