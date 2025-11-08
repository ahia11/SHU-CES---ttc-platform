import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/main.css' // 引入全局样式
import 'cesium/Build/Cesium/Widgets/widgets.css' // 引入 Cesium CSS
// 完整引入Echarts（为了方便）
// 如果追求性能，后续可以改为按需引入
import * as echarts from 'echarts'
import ECharts from 'vue-echarts'

const app = createApp(App)

app.use(router)

// 全局注册 v-chart 组件
app.component('v-chart', ECharts)

app.mount('#app')