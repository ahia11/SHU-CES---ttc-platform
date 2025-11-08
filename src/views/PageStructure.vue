<template>
  <div class="page-container">
    <header class="page-header">
      <h1>🗺️ 微观·结构变迁：一省一“脉络”</h1>
      <p>
        本页面承接Page 1的宏观视角，下钻到“省级”层面，专注分析各省交通客运内部的“结构性变换”（公路 vs 铁路 vs 水运）。
      </p>
    </header>

    <div v-if="!dataLoaded" class="loading-prompt">
      正在加载省级结构数据...
    </div>

    <div class="selector-bar" v-if="dataLoaded">
      <label for="province-select">
        <strong>选择省份 (Select Province):</strong>
      </label>
      <select id="province-select" v-model="selectedProvince" @change="onProvinceChange">
        <option v-for="province in provinceList" :key="province" :value="province">
          {{ province }}
        </option>
      </select>
    </div>

    <div class="chart-section" v-if="dataLoaded && selectedProvinceData.years.length > 0">
      <h2>第一幕：【一省一策】 {{ selectedProvince }} 客运结构演变 (2005-2023)</h2>
      <p class="interpretation">
        下方两张图揭示了 **{{ selectedProvince }}**
        的客运结构演变。 (【已修复】图例选中/未选中颜色)
        <br/>
        **图1 (总量)** 显示了总客运量的增减；
        **图2 (百分比)** 更清晰地反映了内部结构的此消彼长。
        <br/>
        请重点观察 **<span style="color:#f87171">■ 铁路客运</span>** 占比（尤其是2010年高铁发力后）的变化。
      </p>
      <div class="charts-grid-container two-cols">
        <div class="chart-container large">
          <div class="chart-title">图1: 客运总量 (万人) 时序</div>
          <v-chart class="chart" :option="act1_VolumeOption" ref="act1_VolumeChartRef" autoresize />
        </div>
        <div class="chart-container large">
          <div class="chart-title">图2: 客运结构 (百分比) 时序</div>
          <v-chart class="chart" :option="act1_PercentageOption" ref="act1_PercentChartRef" autoresize />
        </div>
      </div>
    </div>

    <div class="chart-section" v-if="dataLoaded">
      <h2>第二幕：【全国横评】客运结构“DNA” (2023)</h2>
      <p class="interpretation">
        不同省份的“出行DNA”差异巨大。下图按“铁路客运”占比排序，展示了2023年各省的客运结构。
        <br/>
        沿海省份（如海南、山东）的“水运”占比较高，而交通枢纽（如河南、安徽）的“铁路”占比更为突出。
        <br/>
        **【HCI 交互】请尝试将鼠标悬停在左侧省份名称上，观察与“第三幕”图表的联动高亮。**
      </p>
      <div class="chart-container extra-large">
        <div class="chart-title">
          全国各省客运结构 (公路/铁路/水运) 百分比 [数据源: merged_provincial_data.json]
        </div>
        <v-chart class="chart" :option="act2_StructureBarsOption" ref="act2_BarChartRef" autoresize />
      </div>
    </div>
    
    <div class="chart-section" v-if="dataLoaded">
      <h2>第三幕：【效率矩阵】铁路基建 vs 客流 (2023)</h2>
      <p class="interpretation">
        “路修得越多，人就越多吗？”
        该散点图展示了“铁路营业里程”与“铁路客运量”的关系。
        <br />
        - **右上象限 (高效枢纽):** 基建与客流双高 (如 广东)。<br />
        - **左上象限 (高度繁忙):** 基建有限但客流极大 (如 上海, 北京)。<br />
        - **右下象限 (地广人稀):** 基建网络庞大，但客流密度低 (如 内蒙古)。<br />
        - **左下象限 (发展中):** 基建与客流均在起步阶段 (如 宁夏, 青海)。
      </p>
      <div class="chart-container large">
        <div class="chart-title">
          铁路营业里程 (万公里) vs 铁路客运量 (万人) [数据源: merged_provincial_data.json]
        </div>
        <v-chart class="chart" :option="act3_EfficiencyScatterOption" ref="act3_ScatterChartRef" autoresize />
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

// ECharts 基础样式
const echartBaseTextStyle = {
  // 【注意】这个基础样式现在只控制坐标轴，不再控制图例
  color: 'var(--text-color)', 
  fontSize: 12,
}
const echartBaseTitleStyle = {
  color: 'var(--text-color)',
  fontSize: 16,
  fontWeight: '600',
}

// --- Ref 定义 ---
const dataLoaded = ref(false)
const allProvincialData = ref({}) // 原始数据
const provinceList = ref([]) // 提取的省份列表 (用于下拉框)
const selectedProvince = ref('') // V-Model

// 剧本一：时序图 (数据依赖 selectedProvince)
const selectedProvinceData = ref({ years: [], road: [], rail: [], water: [] })
const act1_VolumeOption = ref({})
const act1_PercentageOption = ref({})

// 剧本二：结构条形图 (全国数据)
const act2_StructureBarsOption = ref({})

// 剧本三：效率散点图 (全国数据)
const act3_EfficiencyScatterOption = ref({})

// --- 【HCI 改进】为图表实例创建 Ref ---
const act1_VolumeChartRef = ref(null)
const act1_PercentChartRef = ref(null)
const act2_BarChartRef = ref(null)
const act3_ScatterChartRef = ref(null)

// --- ECharts 颜色定义 ---
const colors = {
  road: '#38bdf8', // 公路: 蓝色
  rail: '#f87171', // 铁路: 红色 (突出显示)
  water: '#94a3b8', // 水运: 灰色
}

// --- 生命周期 ---
onMounted(async () => {
  // 【HCI 改进】确保数据加载完毕后，再设置交互
  await loadAllData()
  setupChartInteractions()
})

// --- 数据加载与处理 ---

/**
 * 加载所有数据，并初始化图表
 */
const loadAllData = async () => {
  try {
    const provincialRes = await fetch('/data/merged_provincial_data.json')
    if (!provincialRes.ok) throw new Error('merged_provincial_data.json 加载失败')
    const data = await provincialRes.json()
    
    allProvincialData.value = data
    
    // 1. 提取省份列表并排序，排除"西藏" (因数据缺失较多)
    provinceList.value = Object.keys(data)
      .filter(p => p !== '西藏自治区' && data[p].length > 10) // 简单过滤
      .sort((a, b) => a.localeCompare(b, 'zh-Hans-CN')) // 按拼音排序

    // 2. 设置默认选中
    selectedProvince.value = '四川省' // 默认选中四川

    // 3. 初始化所有图表
    updateAct1_TimeSeriesCharts(selectedProvince.value) // 【已修复】不再需要传入 isInitial
    updateAct2_StructureBars(data)
    updateAct3_EfficiencyScatter(data)

    dataLoaded.value = true

  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

/**
 * 【HCI 改进 1 - 关联视图】设置图表联动
 */
const setupChartInteractions = () => {
  // 给予ECharts实例渲染的缓冲时间
  setTimeout(() => {
    const barChart = act2_BarChartRef.value?.getChart()
    const scatterChart = act3_ScatterChartRef.value?.getChart()

    if (!barChart || !scatterChart) {
      console.warn('HCI 联动失败：图表实例未准备好')
      return
    }

    // 1. 监听条形图的 'mouseover'
    barChart.on('mouseover', (params) => {
      // 仅在悬停于Y轴标签时触发
      if (params.componentType === 'yAxis') {
        const provinceName = params.value;
        // 在散点图中触发 'highlight'
        scatterChart.dispatchAction({
          type: 'highlight',
          seriesIndex: 0,
          name: provinceName // 散点图的 data.name 必须与之一致
        });
      }
    });

    // 2. 监听条形图的 'mouseout'
    barChart.on('mouseout', (params) => {
      if (params.componentType === 'yAxis') {
        // 在散点图中触发 'downplay' (取消高亮)
        scatterChart.dispatchAction({
          type: 'downplay',
          seriesIndex: 0,
          name: params.value
        });
      }
    });
  }, 500); // 500ms 缓冲
}

// =================================================================
// --- ‼️ 已修复的函数从这里开始 ‼️ ---
// =================================================================

/**
 * 【HCI 改进 2 - 动画过渡】响应下拉框变化
 */
const onProvinceChange = () => {
  // 【已修复】不再需要传入 false，直接调用更新
  updateAct1_TimeSeriesCharts(selectedProvince.value)
}


/**
 * 提取省份时序数据 (辅助函数)
 */
const getProvinceData = (provinceName) => {
  const history = allProvincialData.value[provinceName]
  if (!history) return null

  const data = {
    years: [],
    road: [],
    rail: [],
    water: [],
    roadPct: [],
    railPct: [],
    waterPct: [],
  }

  // 第一次遍历：填充绝对值
  history.forEach(d => {
    if (d['年份'] === '2024') return // 排除2024
    
    data.years.push(d['年份'])
    data.road.push(d['公路客运量(万人)'] || 0)
    data.rail.push(d['铁路客运量(万人)'] || 0)
    data.water.push(d['水运客运量(万人)'] || 0)
  })

  // 第二次遍历：计算百分比
  for (let i = 0; i < data.years.length; i++) {
    const total = data.road[i] + data.rail[i] + data.water[i]
    if (total > 0) {
      data.roadPct.push((data.road[i] / total) * 100)
      data.railPct.push((data.rail[i] / total) * 100)
      data.waterPct.push((data.water[i] / total) * 100)
    } else {
      data.roadPct.push(0)
      data.railPct.push(0)
      data.waterPct.push(0)
    }
  }
  return data
}

/**
 * 【剧本一】更新时序图
 * @param {string} provinceName - 省份名称
 * 【已修复】移除了 isInitial 参数和 if/else 逻辑
 */
const updateAct1_TimeSeriesCharts = (provinceName) => {
  const data = getProvinceData(provinceName)
  if (!data) return

  // 存储提取的数据
  selectedProvinceData.value = data

  // 【已修复】始终构建并更新完整的 Option 对象
  // 这样 vue-echarts 才能通过 :option prop 侦测到变化

  // 基础系列样式
  const seriesBaseStyles = [
    { name: '公路客运', type: 'line', smooth: true, color: colors.road, areaStyle: { opacity: 0.7 }, stack: 'Total' },
    { name: '铁路客运', type: 'line', smooth: true, color: colors.rail, areaStyle: { opacity: 0.7 }, stack: 'Total' },
    { name: '水运客运', type: 'line', smooth: true, color: colors.water, areaStyle: { opacity: 0.7 }, stack: 'Total' },
  ]
  
  // 基础选项
  const baseOption = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      top: '5%',
      textStyle: { color: '#333333' },
      inactiveColor: '#999999'
    },
    grid: { top: '20%', left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: data.years,
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
      axisLabel: echartBaseTextStyle,
    },
    yAxis: {
      type: 'value',
      axisLabel: echartBaseTextStyle,
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
    },
    // 【已修复】将过渡动画添加到基础选项中，使其始终生效
    universalTransition: {
      enabled: true,
      seriesKey: ['公路客运', '铁路客运', '水运客运'], // 必须与 series.name 匹配
      delay: 100
    }
  }

  // 图1：总量图
  act1_VolumeOption.value = {
    ...baseOption,
    yAxis: { ...baseOption.yAxis, name: '客运量 (万人)', nameTextStyle: echartBaseTextStyle },
    tooltip: { ...baseOption.tooltip, valueFormatter: (value) => `${value ? value.toFixed(0) : 0} 万人` },
    series: [
      { ...seriesBaseStyles[0], data: data.road },
      { ...seriesBaseStyles[1], data: data.rail },
      { ...seriesBaseStyles[2], data: data.water },
    ]
  }

  // 图2：百分比图
  act1_PercentageOption.value = {
    ...baseOption,
    yAxis: { ...baseOption.yAxis, name: '结构占比 (%)', nameTextStyle: echartBaseTextStyle, max: 100 },
    tooltip: { ...baseOption.tooltip, valueFormatter: (value) => `${value ? value.toFixed(2) : 0} %` },
    series: [
      { ...seriesBaseStyles[0], data: data.roadPct },
      { ...seriesBaseStyles[1], data: data.railPct },
      { ...seriesBaseStyles[2], data: data.waterPct },
    ]
  }
}

// =================================================================
// --- ‼️ 已修复的函数到这里结束 ‼️ ---
// =================================================================


/**
 * 【剧本二】更新全国结构横评图
 */
const updateAct2_StructureBars = (allData) => {
  const structureData = []

  for (const provinceName in allData) {
    if (provinceName === '西藏自治区') continue
    const yearData = allData[provinceName].find(d => d['年份'] === '2023')
    if (yearData) {
      const road = yearData['公路客运量(万人)'] || 0
      const rail = yearData['铁路客运量(万人)'] || 0
      const water = yearData['水运客运量(万人)'] || 0
      const total = road + rail + water
      
      if (total > 0) {
        structureData.push({
          name: provinceName, // 【HCI 改进】使用全名，用于联动
          total: total,
          roadPct: (road / total) * 100,
          railPct: (rail / total) * 100,
          waterPct: (water / total) * 100,
        })
      }
    }
  }

  // 按铁路占比排序
  structureData.sort((a, b) => a.railPct - b.railPct)

  act2_StructureBarsOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params) => {
        let tooltip = `${params[0].name}<br/>`
        let total = 0
        params.forEach(p => {
          tooltip += `${p.marker} ${p.seriesName}: ${p.value.toFixed(1)}%<br/>`
          total += p.value
        })
        return tooltip
      }
    },
    legend: {
      data: ['公路客运', '铁路客运', '水运客运'],
      top: '3%',
      textStyle: { color: '#333333' },
      inactiveColor: '#999999'
    },
    grid: { top: '10%', left: '2%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      max: 100,
      axisLabel: echartBaseTextStyle,
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
    },
    yAxis: {
      type: 'category',
      data: structureData.map(d => d.name),
      axisLabel: echartBaseTextStyle,
      triggerEvent: true // 【HCI 改进】必须开启，Y轴才能响应鼠标事件
    },
    series: [
      { name: '公路客运', type: 'bar', stack: 'Total', data: structureData.map(d => d.roadPct), color: colors.road },
      { name: '铁路客运', type: 'bar', stack: 'Total', data: structureData.map(d => d.railPct), color: colors.rail },
      { name: '水运客运', type: 'bar', stack: 'Total', data: structureData.map(d => d.waterPct), color: colors.water },
    ]
  }
}


/**
 * 【剧本三】更新效率散点图
 */
const updateAct3_EfficiencyScatter = (allData) => {
  const scatterData = []
  let avgMileage = 0
  let avgVolume = 0
  let count = 0

  for (const provinceName in allData) {
    if (provinceName === '西藏自治区') continue
    const yearData = allData[provinceName].find(d => d['年份'] === '2023')
    
    if (yearData) {
      const mileage = yearData['铁路营业里程(万公里)']
      const volume = yearData['铁路客运量(万人)']
      
      if (mileage && mileage > 0 && volume && volume > 0) {
        scatterData.push({
          name: provinceName, // 【HCI 改进】使用全名，用于联动
          value: [mileage, volume]
        })
        avgMileage += mileage
        avgVolume += volume
        count++
      }
    }
  }

  avgMileage /= count
  avgVolume /= count

  act3_EfficiencyScatterOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        return `${params.data.name}<br/>
                铁路里程: ${params.data.value[0]} 万公里<br/>
                铁路客流: ${params.data.value[1]} 万人`
      }
    },
    grid: { top: '10%', left: '3%', right: '7%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'value',
      name: '铁路营业里程 (万公里)',
      nameTextStyle: echartBaseTextStyle, 
      axisLabel: echartBaseTextStyle, 
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
    },
    yAxis: {
      type: 'value',
      name: '铁路客运量 (万人)',
      nameTextStyle: echartBaseTextStyle, 
      axisLabel: echartBaseTextStyle, 
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
    },
    series: [
      {
        type: 'scatter',
        data: scatterData,
        symbolSize: 12,
        color: colors.rail, // 使用铁路的红色
        // 【HCI 改进】高亮样式
        emphasis: {
          focus: 'self',
          scale: 1.5,
          label: {
            show: true,
            formatter: '{b}', // {b} 是 data.name
            position: 'top',
            color: 'var(--text-color)',
            fontWeight: 'bold'
          }
        },
        // 象限线
        markLine: {
          silent: true,
          lineStyle: { type: 'dashed', color: 'var(--text-color)' }, 
          data: [
            { xAxis: avgMileage, name: '平均里程' },
            { yAxis: avgVolume, name: '平均客流' }
          ],
          label: {
            formatter: '{b}',
            color: 'var(--text-color)', 
          }
        }
      }
    ]
  }
}

</script>

<style scoped>
/* 样式与原文件保持一致，无需修改 */
/* 为 Page 2 定义页面主题色 (accent-color) */
.page-container {
  --accent-color: var(--color-green); 
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem 2rem 2rem;
}

/* --- 头部 --- */
.page-header {
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(
    90deg,
    var(--accent-color) 0%,
    var(--text-color) 100%
  );
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header p {
  font-size: 1.1rem;
  color: var(--text-color-light);
  max-width: 900px;
}
.loading-prompt {
  color: var(--text-color-light);
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
}

/* --- 省份选择器 --- */
.selector-bar {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--sidebar-bg);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  margin-bottom: 1.5rem;
}
.selector-bar label {
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
}
.selector-bar select {
  padding: 0.5rem 1rem;
  font-size: 1.1rem;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background-color: var(--bg-color);
  color: var(--text-color);
  font-family: inherit;
  cursor: pointer;
}

/* --- 图表分区 --- */
.chart-section {
  margin-top: 2rem;
  margin-bottom: 1rem;
}
.chart-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--accent-color); /* 使用 accent-color */
  margin-bottom: 0.5rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid var(--border-color);
}
.interpretation {
  font-size: 1rem;
  color: var(--text-color-light);
  max-width: 1000px; 
  margin-bottom: 1rem;
  line-height: 1.6;
}

/* --- 图表容器 --- */
.chart-container {
  position: relative;
  width: 100%;
  background-color: var(--sidebar-bg);
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color);
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-direction: column;
}
.chart-title {
  position: relative;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color);
  z-index: 10;
  margin-bottom: 0.5rem;
}
.chart {
  flex-grow: 1;
  height: 100%;
  width: 100%;
}

/* --- 尺寸控制 --- */
.chart-container.large {
  height: 500px;
}
.chart-container.extra-large {
  height: 800px;
}

/* --- 栅格布局 --- */
.charts-grid-container.two-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  align-items: flex-start;
}

@media (max-width: 1200px) {
  .charts-grid-container.two-cols {
    grid-template-columns: 1fr;
  }
}
</style>