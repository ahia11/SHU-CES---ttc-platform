<template>
  <div class="page-container">
    <header class="page-header">
      <h1>📊 原始数据：多维数据探索</h1>
      <p>
        此页面加载您的真实JSON数据，并使用高级图表进行多维度、全指标的可视化。
      </p>
    </header>

    <div v-if="!dataLoaded" class="loading-prompt">
      正在加载真实数据... (请确保 data/ 和 map/ 目录下的 .json 文件已放置)
    </div>

    <section class="data-section" v-if="dataLoaded">
      <h2>全国年度数据 (2005-2023)</h2>
      
      <div class="charts-grid-4">
        
        <div class="chart-container small">
          <div class="chart-title">经济指标 (Line Race)</div>
          <v-chart class="chart" :option="nationalChart_EconomyRace" autoresize />
        </div>
        
        <div class="chart-container small">
          <div class="chart-title">旅游指标 (年度趋势)</div>
          <v-chart class="chart" :option="nationalChart_TourismStatic" autoresize />
        </div>
        
        <div class="chart-container small">
          <div class="chart-title">交通里程 (Line Race)</div>
          <v-chart class="chart" :option="nationalChart_TransportRace" autoresize />
        </div>
        
        <div class="chart-container small">
          <div class="chart-title">航线里程 (年度趋势)</div>
          <v-chart class="chart" :option="nationalChart_TransportStatic" autoresize />
        </div>
        
      </div>
    </section>
    <section class="data-section" v-if="dataLoaded">
      <h2>分省数据探索 (2005-2023)</h2>
      <div class="provincial-controls">
        <label for="metric-select">请选择分析指标:</label>
        <select id="metric-select" v-model="selectedMetric">
          <option
            v-for="metric in provincialMetrics"
            :key="metric"
            :value="metric"
          >
            {{ metric }}
          </option>
        </select>
      </div>

      <div class="charts-grid-1">
        <div class="chart-container large race">
          <div class="chart-title">
            各省动态增长数据 ({{ selectedMetric }})
          </div>
          <v-chart class="chart" :option="barRaceOption" autoresize />
        </div>
      </div>

      <div class="charts-grid-2">
        <div class="chart-container large">
          <div class="chart-title">分省指标热力图 ({{ selectedMetric }})</div>
          <p class="interpretation" style="font-size: 0.9rem; color: var(--text-color-light); margin-top: 2rem;">
            **【HCI 交互】请尝试将鼠标悬停在任意色块上，查看该省份的完整历史趋势（微型图）。**
          </p>
          <v-chart class="chart" :option="heatmapOption" autoresize />
        </div>

        <div class="chart-container large map3d">
          <div class="chart-title">
            3D 地球热力图 ({{ selectedMetric }})
          </div>
          
          <GlobeMap
            v-if="dataLoaded"
            :selectedMetric="selectedMetric"
            :provincialData="processedProvincialData"
            :provinceNameMap="shortNameMap"
            class="chart"
          />
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
// 【HCI 改进】导入 nextTick 用于异步渲染 Tooltip
import { ref, onMounted, computed, nextTick } from 'vue'
import * as echarts from 'echarts'
import GlobeMap from '../components/GlobeMap.vue'

const dataLoaded = ref(false)

// 4 个 ref (不变)
const nationalChart_EconomyRace = ref({})
const nationalChart_TourismStatic = ref({})
const nationalChart_TransportRace = ref({})
const nationalChart_TransportStatic = ref({})

// 分省数据状态 (不变)
const provincialMetrics = ref([ '全体居民人均可支配收入(元)', '客运量(万人)', '民用汽车拥有量(万辆)', '高速等级公路里程(万公里)', '铁路客运量(万人)', '公路客运量(万人)', '水运客运量(万人)', '公路里程(万公里)', '铁路营业里程(万公里)', ])
const selectedMetric = ref('全体居民人均可支配收入(元)')
const processedProvincialData = ref([])
const provinceNameList = ref([])
const yearList = ref( Array.from({ length: 2023 - 2005 + 1 }, (_, i) => (2005 + i).toString()) )
const shortNameMap = ref({})

onMounted(() => {
  loadAllData()
})

// 数据加载与处理 (不变)
const loadAllData = async () => {
  try {
    const [nationalRes, provincialRes, mapRes] = await Promise.all([
      fetch('/data/yeardatas_converted.json'),
      fetch('/data/merged_provincial_data.json'),
      fetch('/map/china.json'),
    ])
    if (!nationalRes.ok) throw new Error('yeardatas_converted.json 加载失败')
    if (!provincialRes.ok) throw new Error('merged_provincial_data.json 加载失败')
    if (!mapRes.ok) throw new Error('china.json 加载失败')
    const nationalData = await nationalRes.json()
    const provincialData = await provincialRes.json()
    const chinaJson = await mapRes.json()
    echarts.registerMap('china', chinaJson)
    processNationalData(nationalData)
    processProvincialData(provincialData)
    dataLoaded.value = true
  } catch (error) {
    console.error('数据加载失败:', error)
  }
}

// ===================================
// 【全国数据处理函数】
// ===================================
function processNationalData(data) {
  const years = yearList.value
  
  // 1. 提取器 (不变)
  const extract = (key) =>
    data[key]
      .filter((d) => d['年份'] !== '2024')
      .map((d) => d['数值'])
      .reverse()
  
  // 2. 准备数据 (不变)
  const allData = { '收入': extract('居民人均可支配收入(元)'), '消费': extract('居民消费水平(元)'), '旅游花费': extract('国内旅游人均花费(元)'), '游客': extract('国内游客(百万人次)'), '公路': extract('公路里程(万公里)'), '高速': extract('高速等级路公路里程(万公里)'), '铁路': extract('铁路营业里程(万公里)'), '航线': extract('定期航班航线里程(公里)') }
  
  // 3. 通用函数: 动态 Line Race
  const createLineRaceOption = (title, unit, metrics) => {
    return {
      backgroundColor: 'transparent',
      title: { text: title, textStyle: { color: 'transparent' } },
      tooltip: { trigger: 'axis' },
      // 【✅ BUG 修复】将图例文字颜色硬编码为深色
      legend: { textStyle: { color: '#333333' }, top: 10, type: 'scroll' },
      grid: { left: '12%', right: '5%', bottom: '25%' },
      timeline: {
        axisType: 'category',
        autoPlay: true,
        playInterval: 800,
        data: years.map(y => y.slice(-2)),
        label: { color: 'var(--text-color)' },
        bottom: '5%',
        left: '10%',
        right: '10%',
        controlStyle: { color: 'var(--text-color)', borderColor: 'var(--text-color)' }
      },
      baseOption: {
        yAxis: {
          type: 'value',
          name: unit,
          nameTextStyle: { color: 'var(--text-color-light)' },
          axisLine: { lineStyle: { color: 'var(--border-color)' } },
          splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
        },
        xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: 'var(--border-color)' } } },
        series: metrics.map(metric => ({
          name: metric.name,
          type: 'line',
          smooth: true,
          symbol: 'none',
          data: [], // 初始为空
          lineStyle: { width: 3, color: metric.color },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: metric.color + '80' },
              { offset: 1, color: metric.color + '00' }
            ])
          }
        }))
      },
      options: years.map((year, index) => ({
        series: metrics.map(metric => ({
          data: allData[metric.key].slice(0, index + 1)
        }))
      }))
    }
  }
  
  // 4. 通用函数: 静态单轴面积图 (不变)
  const createStaticAreaOption = (title, unit, metric) => {
    return {
      backgroundColor: 'transparent',
      title: { text: title, textStyle: { color: 'transparent' } },
      tooltip: { trigger: 'axis' },
      grid: { left: '12%', right: '5%', bottom: '20%' },
      dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: '5%', dataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } }, selectedDataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } }, handleStyle: { color: 'var(--accent-color)' }, fillerColor: 'rgba(0, 122, 255, 0.1)' }],
      xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: 'var(--border-color)' } } },
      yAxis: {
        type: 'value',
        name: unit,
        nameTextStyle: { color: 'var(--text-color-light)' },
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }
      },
      series: [{
        name: metric.name,
        type: 'line',
        smooth: true,
        data: allData[metric.key],
        lineStyle: { width: 3, color: metric.color },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: metric.color + '80' },
            { offset: 1, color: metric.color + '00' }
          ])
        }
      }]
    }
  }

  // 5. 通用函数: 静态双轴面积图 (用于旅游)
  const createStaticDualAxisOption = (title, yAxis1, yAxis2, seriesConfig) => {
    const series = seriesConfig.map(s => ({
      ...s,
      type: 'line',
      smooth: true,
      data: allData[s.key],
      lineStyle: { width: 3, color: s.color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: s.color + '80' },
          { offset: 1, color: s.color + '00' }
        ])
      },
      emphasis: { focus: 'series' }
    }));

    return {
      backgroundColor: 'transparent',
      title: { text: title, textStyle: { color: 'transparent' } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' } },
      // 【✅ BUG 修复】将图例文字颜色硬编码为深色
      legend: { textStyle: { color: '#333333' }, top: 10, type: 'scroll' },
      grid: { left: '10%', right: '10%', bottom: '20%' },
      dataZoom: [{ type: 'inside' }, { type: 'slider', bottom: '5%', dataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } }, selectedDataBackground: { lineStyle: { color: 'transparent' }, areaStyle: { color: 'transparent' } }, handleStyle: { color: 'var(--accent-color)' }, fillerColor: 'rgba(0, 122, 255, 0.1)' }],
      xAxis: { type: 'category', data: years, axisLine: { lineStyle: { color: 'var(--border-color)' } } },
      yAxis: [
        { type: 'value', name: yAxis1.name, nameTextStyle: { color: 'var(--text-color-light)' }, axisLine: { lineStyle: { color: yAxis1.color } }, splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } } },
        { type: 'value', name: yAxis2.name, nameTextStyle: { color: 'var(--text-color-light)' }, axisLine: { lineStyle: { color: yAxis2.color } }, splitLine: { show: false } },
      ],
      series: series
    }
  }

  // --- 生成 4 个图表 (逻辑不变) ---
  nationalChart_EconomyRace.value = createLineRaceOption( '经济指标', '元', [ { name: '居民人均可支配收入', key: '收入', color: '#38bdf8' }, { name: '居民消费水平', key: '消费', color: '#60a5fa' } ] )
  nationalChart_TourismStatic.value = createStaticDualAxisOption( '旅游指标', { name: '花费 (元)', color: '#a3e635' }, { name: '游客 (百万人次)', color: '#4ade80' }, [ { name: '国内旅游人均花费', key: '旅游花费', yAxisIndex: 0, color: '#a3e635' }, { name: '国内游客', key: '游客', yAxisIndex: 1, color: '#4ade80' } ] )
  nationalChart_TransportRace.value = createLineRaceOption( '交通里程', '万公里', [ { name: '公路里程', key: '公路', color: '#f87171' }, { name: '高速等级路公路里程', key: '高速', color: '#fb923c' }, { name: '铁路营业里程', key: '铁路', color: '#facc15' } ] )
  nationalChart_TransportStatic.value = createStaticAreaOption( '航线里程', '公里', { name: '定期航班航线里程', key: '航线', color: '#f472b6' } )
}


// ===================================
// 分省数据处理 (不变)
// ===================================
function processProvincialData(data) {
  // ... (逻辑不变) ...
  const flatData = []
  const provinceNames = []
  const tempShortNameMap = {}
  for (const provinceName in data) {
    const shortName = provinceName.replace(/省|市|自治区|回族|维吾尔/g, '').replace('内蒙古', '内蒙').replace('黑龙江', '黑龙江')
    provinceNames.push(shortName)
    tempShortNameMap[shortName] = provinceName;
    const provinceHistory = data[provinceName]
    for (const yearData of provinceHistory) {
      if (yearData['年份'] === '2024') continue
      const flatEntry = { province: shortName, year: yearData['年份'], }
      for (const metric of provincialMetrics.value) {
        const value = (yearData[metric] === 0 || isNaN(yearData[metric])) ? null : yearData[metric]
        flatEntry[metric] = value
      }
      flatData.push(flatEntry)
    }
  }
  processedProvincialData.value = flatData
  provinceNameList.value = provinceNames.sort()
  shortNameMap.value = tempShortNameMap;
}

// --- 【图表 4.5: 动态排序条形图】(不变) ---
const barRaceOption = computed(() => {
  // ... (数据处理逻辑不变) ...
  const metric = selectedMetric.value
  const years = yearList.value
  let yearDataMap = {}
  for (const year of years) {
    const dataForYear = processedProvincialData.value.filter(d => d.year === year && d[metric] !== null).map(d => ({ value: d[metric], name: d.province })).sort((a, b) => b.value - a.value).slice(0, 15)
    yearDataMap[year] = dataForYear;
  }
  let allValues = []
  processedProvincialData.value.forEach(d => { if(d[metric] !== null) allValues.push(d[metric]) })
  const globalMax = Math.max(...allValues)
  
  return {
    backgroundColor: 'transparent',
    timeline: {
      axisType: 'category',
      autoPlay: true,
      playInterval: 1000,
      data: years,
      label: { color: 'var(--text-color)' },
      bottom: '5%',
      left: '10%',
      right: '10%',
      controlStyle: { color: 'var(--text-color)', borderColor: 'var(--text-color)' }
    },
    baseOption: {
      tooltip: { trigger: 'item', formatter: (p) => `${p.name}<br/>${p.value}` },
      grid: { left: '120', right: '40', top: '10%', bottom: '20%' },
      xAxis: {
        type: 'value',
        max: globalMax,
        name: metric,
        nameTextStyle: { color: 'var(--text-color-light)' },
        axisLine: { lineStyle: { color: 'var(--border-color)' } },
        splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: [],
        axisLabel: { color: 'var(--text-color)' },
        inverse: true,
      },
      visualMap: {
        type: 'continuous',
        dimension: 0,
        min: 0,
        max: globalMax,
        inRange: { color: ['#1e3a8a', '#38bdf8', '#facc15', '#f87171'] }, // OK
        show: false,
      },
      series: [
        {
          type: 'bar',
          data: [],
          label: { show: true, position: 'right', color: 'var(--text-color)', formatter: '{c}' },
        },
      ],
    },
    options: years.map((year) => {
      const yearData = yearDataMap[year];
      return {
        yAxis: { data: yearData.map(d => d.name) },
        series: [ { data: yearData } ],
      }
    }),
  }
})

// =================================================================
// --- ‼️ 已修复的 heatmapOption (动态排序) 从这里开始 ‼️ ---
// =================================================================

// --- 【图表 4.3: 热力图】 (已按平均值排序) ---
const heatmapOption = computed(() => {
  const metric = selectedMetric.value
  
  // 1. 准备原始热力图数据 (不变)
  const data = processedProvincialData.value
    .map((d) => [d.year, d.province, d[metric]])
    .filter((d) => d[2] !== null)
  
  const values = data.map(d => d[2]);
  const min = Math.min(...values);
  const max = Math.max(...values);

  // --- ‼️ 动态排序Y轴 (新逻辑) ‼️ ---

  // 1.1 计算每个省份的“平均值”
  const provinceAverages = new Map();
  const provinceCounts = new Map();

  processedProvincialData.value.forEach(d => {
    const province = d.province;
    const value = d[metric];

    if (value != null && !isNaN(value)) {
      provinceAverages.set(province, (provinceAverages.get(province) || 0) + value);
      provinceCounts.set(province, (provinceCounts.get(province) || 0) + 1);
    }
  });

  // 1.2 创建包含平均值的省份统计列表
  const provinceStats = [];
  provinceAverages.forEach((total, province) => {
    const count = provinceCounts.get(province);
    if (count > 0) {
      provinceStats.push({
        name: province,
        average: total / count
      });
    }
  });

  // 1.3 按平均值升序排序
  // (ECharts Y轴 0 索引在底部, 所以升序排列会把“高数值”省份放在顶部)
  provinceStats.sort((a, b) => a.average - b.average);

  // 1.4 提取排序后的省份名称列表
  const sortedProvinceNames = provinceStats.map(d => d.name);

  // --- ‼️ 排序逻辑结束 ‼️ ---
  
  return {
    backgroundColor: 'transparent',
    // 【HCI 改进 - 超级工具提示】(不变)
    tooltip: {
      position: 'top',
      trigger: 'item',
      formatter: (params) => {
        // params.data = [year, provinceShortName, value]
        const [year, provinceShortName, value] = params.data;
        const provinceFullName = shortNameMap.value[provinceShortName] || provinceShortName;
        
        // 1. 准备微型图数据
        const provinceHistory = processedProvincialData.value
          .filter(d => d.province === provinceShortName && d[metric] != null)
          .sort((a, b) => parseInt(a.year) - parseInt(b.year)); // 按年份排序
        
        const sparklineYears = provinceHistory.map(d => d.year);
        const sparklineData = provinceHistory.map(d => d[metric]);

        // 2. 创建 DOM 容器
        const containerId = `tooltip-chart-${provinceShortName}-${year}`;
        const container = document.createElement('div');
        container.style.width = '300px';
        container.style.height = '150px';
        container.id = containerId;
        
        // 3. 异步渲染 ECharts 实例
        // 使用 nextTick 确保 DOM 元素在 ECharts init 之前已创建
        nextTick(() => {
          const chartDom = document.getElementById(containerId);
          if (chartDom && !echarts.getInstanceByDom(chartDom)) { // 防止重复初始化
            const sparklineChart = echarts.init(chartDom);
            sparklineChart.setOption({
              grid: { top: 15, bottom: 20, left: 45, right: 15 },
              xAxis: { type: 'category', data: sparklineYears, show: false },
              yAxis: { 
                type: 'value',
                show: true,
                axisLabel: { fontSize: 10 },
                splitLine: { lineStyle: { type: 'dashed', color: '#ccc' } }
              },
              series: [{
                type: 'line',
                data: sparklineData,
                smooth: true,
                symbol: 'none',
                lineStyle: { color: 'var(--accent-color)', width: 2 },
                // 标记当前点
                markPoint: {
                  data: [{
                    name: '当前',
                    xAxis: year, // 标记当前年份
                    yAxis: value,
                    symbol: 'circle',
                    symbolSize: 8,
                    itemStyle: { color: '#f87171' }
                  }],
                  label: { show: false }
                }
              }]
            });
          }
        });

        // 4. 返回带标题的容器
        return `
          <div style="font-size: 14px; font-weight: 600; margin-bottom: 5px; color: #333;">
            ${provinceFullName}
          </div>
          <div style="font-size: 12px; margin-bottom: 5px; color: #555;">
            ${year}年 ${metric.split('(')[0]}: 
            <strong style="color: #000;">${value != null ? value.toFixed(2) : 'N/A'}</strong>
          </div>
          ${container.outerHTML}
        `;
      }
    },
    grid: { left: '100', right: '10%', bottom: '15%' },
    xAxis: {
      type: 'category', data: yearList.value, splitArea: { show: true },
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
    },
    yAxis: {
      type: 'category', 
      data: sortedProvinceNames, // <-- 【已修复】使用排序后的列表
      splitArea: { show: true },
      axisLine: { lineStyle: { color: 'var(--border-color)' } },
    },
    dataZoom: [
      { type: 'inside', yAxisIndex: 0, zoomOnMouseWheel: 'true', moveOnMouseWheel: true },
      { type: 'slider', yAxisIndex: 0, show: true, width: 20, right: '2%',
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
        fillerColor: 'rgba(0, 122, 255, 0.2)',
        borderColor: 'transparent'
      },
    ],
    visualMap: {
      type: 'continuous', min: min, max: max, calculable: true,
      orient: 'horizontal', left: 'center', bottom: '0',
      textStyle: { color: 'var(--text-color)' },
      inRange: { color: ['#1e3a8a', '#38bdf8', '#facc15', '#f87171'] }, // OK
    },
    series: [{
      name: metric, type: 'heatmap', data: data, label: { show: false },
      emphasis: { itemStyle: { borderColor: '#fff', borderWidth: 1 } }, // OK
    }],
  }
})

// =================================================================
// --- ‼️ 已修复的 heatmapOption (动态排序) 到这里结束 ‼️ ---
// =================================================================

</script>

<style scoped>
/* 样式与原文件保持一致，无需修改 */
/* 【修复】定义 Page 4 自己的主题色 (粉色) */
.page-container {
  --page-accent: #f472b6;
  max-width: 1600px;
  margin: 0 auto;
}
.page-header {
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  /* 【修复】使用 --page-accent 和 var(--text-color) */
  background: linear-gradient(90deg, var(--page-accent) 0%, var(--text-color) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header p {
  font-size: 1.1rem;
  color: var(--text-color-light);
}

.data-section {
  margin-top: 2rem;
  border-top: 1px solid var(--border-color);
  padding-top: 1.5rem;
}
.data-section h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1.5rem;
}

.charts-grid-1 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

.charts-grid-2 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}
@media (min-width: 1024px) {
  .charts-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
}

.charts-grid-4 {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
@media (min-width: 1024px) {
  .charts-grid-4 {
    grid-template-columns: 1fr 1fr;
  }
}

.chart-container {
  position: relative;
  height: 450px;
  width: 100%;
  background-color: var(--sidebar-bg); /* 浅色 (白) */
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color); /* 浅灰 */
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05); /* 阴影 */
}

.chart-container.small {
  height: 400px;
}
.chart-container.large {
  height: 600px;
}
.chart-container.race {
  height: 700px;
}

/* 3D地球背景 (OK) */
.chart-container.map3d {
  background-color: #000;
  padding: 0;
  overflow: hidden;
}
.chart-container.map3d .chart {
  padding-top: 0;
}

.chart-title {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color); /* 深色 */
  z-index: 10;
}
/* 3D地图的标题 (OK) */
.chart-container.map3d .chart-title {
  color: #fff;
  text-shadow: 0 0 5px #000;
}

.chart {
  height: 100%;
  width: 100%;
  padding-top: 30px;
}
.loading-prompt {
  color: var(--text-color-light);
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
}

.provincial-controls {
  margin-bottom: 1.5rem;
  background-color: var(--sidebar-bg); /* 浅色 (白) */
  padding: 1rem;
  border-radius: 8px;
  display: flex;
  align-items: center;
  gap: 1rem;
}
.provincial-controls label {
  font-size: 1rem;
  font-weight: 500;
  color: var(--text-color-light);
}
.provincial-controls select {
  flex-grow: 1;
  padding: 0.5rem;
  font-size: 1rem;
  background-color: var(--sidebar-bg); /* 【修复】改为白色 */
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
}
</style>