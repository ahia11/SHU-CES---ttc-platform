<template>
  <div class="home-container">

    <header class="hero-section dynamic">
      <div class="hero-content-dynamic">
        <h1 class="hero-title">洞察数据，驱动未来。</h1>
        <p class="hero-subtitle">
          您的一站式智能分析平台：集成门槛效应、空间溢出与动态因果。
        </p>
        
        <div class="hero-chart-grid" v-if="heroDataLoaded">
          <div class="hero-chart-cell">
            <div class="chart-label">
              <span>全国公路里程 (万公里)</span>
              <span class="chart-value">{{ heroValues.highway.toFixed(2) }}</span>
            </div>
            <v-chart class="spark-chart" :option="highwaySparkOption" autoresize />
          </div>
          <div class="hero-chart-cell">
            <div class="chart-label">
              <span>全国铁路营业里程 (万公里)</span>
              <span class="chart-value">{{ heroValues.railway.toFixed(2) }}</span>
            </div>
            <v-chart class="spark-chart" :option="railSparkOption" autoresize />
          </div>
          <div class="hero-chart-cell">
            <div class="chart-label">
              <span>国内游客 (百万人次)</span>
              <span class="chart-value">{{ heroValues.tourism.toFixed(0) }}</span>
            </div>
            <v-chart class="spark-chart" :option="tourismSparkOption" autoresize />
          </div>
          <div class="hero-chart-cell">
            <div class="chart-label">
              <span>居民人均可支配收入 (元)</span>
              <span class="chart-value">{{ heroValues.income.toFixed(0) }}</span>
            </div>
            <v-chart class="spark-chart" :option="incomeSparkOption" autoresize />
          </div>
        </div>
        
        <div class="hero-cta">
          <router-link to="/explorer" class="cta-button-primary">开始探索</router-link>
        </div>
      </div>
    </header>

    <section class="features-section">
      <div class="features-grid">
        
        <router-link to="/explorer" class="feature-card-link">
          <div class="feature-card" id="card-explorer">
            <div class="card-icon">📊</div>
            <h3 class="card-title">数据探索</h3>
            <p class="card-description">
              通过直观的图表和交互式筛选，深入了解您数据的分布、趋势和异常值。
            </p>
            <span class="card-link">了解更多 &rarr;</span>
          </div>
        </router-link>
        
        <router-link to="/structure" class="feature-card-link">
          <div class="feature-card" id="card-structure"> <div class="card-icon">📈</div> <h3 class="card-title">结构变迁分析</h3> <p class="card-description">
              下钻到省级层面，专注分析各省交通客运内部的“结构性变换”（公路 vs 铁路 vs 水运）。
            </p>
            <span class="card-link">了解更多 &rarr;</span>
          </div>
        </router-link>

        <router-link to="/spatial" class="feature-card-link">
          <div class="feature-card" id="card-spatial">
            <div class="card-icon">🗺️</div>
            <h3 class="card-title">空间溢出</h3>
            <p class="card-description">
              量化分析一个地区的经济活动（如消费、创新）如何影响其邻近地区。
            </p>
            <span class="card-link">了解更多 &rarr;</span>
          </div>
        </router-link>

        <router-link to="/causal" class="feature-card-link">
          <div class="feature-card" id="card-causal">
            <div class="card-icon">🔄</div>
            <h3 class="card-title">动态因果</h3>
            <p class="card-description">
              超越静态的相关性，揭示变量之间随时间变化的因果传导路径。
            </p>
            <span class="card-link">了解更多 &rarr;</span>
          </div>
        </router-link>

      </div>
    </section>

    <section class="final-cta-section">
      <h2 class="final-cta-title">准备好释放数据的全部潜力了吗？</h2>
      <p class="final-cta-subtitle">
        从今天开始，将复杂数据转化为清晰洞察。
      </p>
      <div class="hero-cta">
        <router-link to="/explorer" class="cta-button-primary">立即开始分析</router-link>
      </div>
    </section>

  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'
import { ref, onMounted, reactive } from 'vue'
import * as echarts from 'echarts'

// 【HCI 改进】图表 Refs
const heroDataLoaded = ref(false)
const highwaySparkOption = ref({})
const railSparkOption = ref({})
const tourismSparkOption = ref({})
const incomeSparkOption = ref({})
const heroValues = reactive({
  highway: 0,
  railway: 0,
  tourism: 0,
  income: 0,
})

// 【HCI 改进】创建微型图的辅助函数
const createSparkOption = (data, color) => {
  const values = data.map(d => d['数值']).reverse() // 确保按时间正序
  const latestValue = values.length > 0 ? values[values.length - 1] : 0
  
  return {
    grid: { top: 5, bottom: 5, left: 5, right: 5 },
    xAxis: { type: 'category', data: data.map(d => d['年份']).reverse(), show: false },
    yAxis: { type: 'value', show: false, min: 'dataMin', max: 'dataMax' },
    series: [{
      type: 'line',
      data: values,
      smooth: true,
      symbol: 'none',
      lineStyle: { width: 3, color: color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color + '80' },
          { offset: 1, color: color + '00' }
        ])
      },
      // 关键：进入动画
      animationEasing: 'cubicInOut',
      animationDuration: 2000,
      animationDelay: 500
    }]
  }
}

// 【HCI 改进】加载英雄图表数据
const loadHeroData = async () => {
  try {
    const response = await fetch('/data/yeardatas_converted.json')
    if (!response.ok) throw new Error('yeardatas_converted.json 加载失败')
    const nationalData = await response.json()

    const highwayData = nationalData['公路里程(万公里)'].filter(d => d.年份 !== '2024')
    const railwayData = nationalData['铁路营业里程(万公里)'].filter(d => d.年份 !== '2024')
    const tourismData = nationalData['国内游客(百万人次)'].filter(d => d.年份 !== '2024')
    const incomeData = nationalData['居民人均可支配收入(元)'].filter(d => d.年份 !== '2024')

    highwaySparkOption.value = createSparkOption(highwayData, '#38bdf8')
    railSparkOption.value = createSparkOption(railwayData, '#f87171')
    tourismSparkOption.value = createSparkOption(tourismData, '#4ade80')
    incomeSparkOption.value = createSparkOption(incomeData, '#facc15')
    
    heroValues.highway = highwayData[0].数值 // 2023 年数据在最前面
    heroValues.railway = railwayData[0].数值
    heroValues.tourism = tourismData[0].数值
    heroValues.income = incomeData[0].数值

    heroDataLoaded.value = true
  } catch (error) {
    console.error('英雄图表数据加载失败:', error)
  }
}

onMounted(() => {
  loadHeroData()
})

</script>

<style scoped>
.home-container {
  padding: 0;
  margin: -2rem; /* 抵消 App.vue 的 padding */
  text-align: center;
  background-color: #ffffff; /* 确保页面底色为白色 */
}

/* -----------------
 * 1. Hero Section
 * -----------------
 */
.hero-section {
  padding: 4rem 2rem 4rem; /* 调整内边距 */
  background-image: radial-gradient(at 50% 0%, hsla(210, 60%, 95%, 0.4), transparent 50%);
  border-bottom: 1px solid var(--border-color);
}

.hero-content-dynamic {
  max-width: 1000px; /* 放大容器以容纳网格 */
  margin: 0 auto;
}

.hero-title {
  font-size: 3.5rem; 
  font-weight: 700;
  letter-spacing: -0.015em;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.hero-subtitle {
  font-size: 1.5rem;
  font-weight: 400;
  color: var(--text-color-light); 
  line-height: 1.5;
  margin: 0 auto 2rem; /* 减少与网格的间距 */
}

/* 【HCI 改进】英雄图表网格样式 */
.hero-chart-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1.5rem;
  margin-bottom: 3rem;
  max-width: 900px;
  margin-left: auto;
  margin-right: auto;
}

.hero-chart-cell {
  background-color: var(--sidebar-bg);
  border-radius: 16px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  text-align: left;
  height: 150px; /* 固定高度 */
  display: flex;
  flex-direction: column;
}

.chart-label {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  color: var(--text-color);
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.chart-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: var(--accent-color);
}
.spark-chart {
  width: 100%;
  flex-grow: 1; /* 占据剩余空间 */
}


.hero-cta {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

/* -----------------
 * CTA 按钮 (Apple 风格)
 * -----------------
 */
.cta-button-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  border-radius: 980px; /* 胶囊形状 */
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.3s ease;
  background-color: var(--accent-color); 
  color: white;
}
.cta-button-primary:hover {
  background-color: #0071e3;
}

/* -----------------
 * 2. Features Section (样式不变)
 * -----------------
 */
.features-section {
  padding: 4rem 2rem;
  background-color: #ffffff;
}

.features-grid {
  display: grid;
  grid-template-columns: 1fr; /* 移动端堆叠 */
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

/* 在中等屏幕及以上，变为 2x2 网格 */
@media (min-width: 768px) {
  .features-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.feature-card-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.feature-card {
  background-color: var(--sidebar-bg); /* 使用浅灰色背景 */
  padding: 2.5rem;
  border-radius: 24px; /* 更大的圆角 */
  text-align: left;
  height: 100%;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.feature-card-link:hover .feature-card {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08);
}

.card-icon {
  font-size: 2.5rem;
  margin-bottom: 1rem;
}

.card-title {
  font-size: 1.75rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.card-description {
  font-size: 1rem;
  color: var(--text-color-light);
  line-height: 1.6;
  margin-bottom: 1.5rem;
}

.card-link {
  font-size: 1rem;
  font-weight: 500;
  color: var(--accent-color);
}

/* -----------------
 * 3. Final CTA Section (样式不变)
 * -----------------
 */
.final-cta-section {
  padding: 5rem 2rem 6rem;
  background-color: #1d1d1f; /* 仿 Apple 深色 */
  color: #f5f5f7;
}

.final-cta-title {
  font-size: 2.5rem;
  font-weight: 600;
  max-width: 600px;
  margin: 0 auto 1rem;
}

.final-cta-subtitle {
  font-size: 1.25rem;
  font-weight: 400;
  color: rgba(245, 245, 247, 0.8);
  margin: 0 auto 2.5rem;
}

/* 响应式调整英雄网格 */
@media (max-width: 768px) {
  .hero-chart-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
  .hero-chart-cell {
    height: 130px; /* 移动端稍矮 */
  }
  .hero-title {
    font-size: 2.5rem;
  }
  .hero-subtitle {
    font-size: 1.2rem;
  }
}
</style>