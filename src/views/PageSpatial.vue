<template>
  <div class="page-container spatial-page">
    <header class="page-header">
      <h1>🗺️ 空间溢出：区域联动的财富版图</h1>
      <p>
        本页面通过“真实数据”与“模拟模型”的动态联动，探索A省的交通建设（T）如何“溢出”影响B省的旅游（T2）和消费（C）。
      </p>
    </header>

    <blockquote class="warning" v-if="!mapLoaded">
      <strong>地图与数据加载中...</strong>
      <p>
        (请确保 <code>china.json</code>,
        <code>merged_provincial_data.json</code>, 和
        <code>yeardatas_converted.json</code> 均在 <code>public/</code> 目录中)
      </p>
    </blockquote>

    <header class="page-header secondary" v-if="mapLoaded">
      <h2>📊 第零幕：宏观背景 (全国2005-2024)</h2>
      <p>
        在探索省际空间溢出之前，我们先观察研究变量在全国层面的20年宏观走势。
        (数据来源: <code>yeardatas_converted.json</code>)
      </p>
    </header>
    <div class="national-charts-grid" v-if="mapLoaded">
      <div class="chart-container small">
        <div class="chart-title">全国交通建设 (T) 趋势</div>
        <v-chart
          class="chart"
          :option="nationalTransportOption"
          autoresize
        />
      </div>
      <div class="chart-container small">
        <div class="chart-title">全国旅游 (T2) 与消费 (C) 趋势</div>
        <v-chart class="chart" :option="nationalTourismOption" autoresize />
      </div>
    </div>
    
    <div class="controls-and-stats-wrapper" v-if="mapLoaded">
      <div class="narrative-box">
        <h3>第一幕：观察真实指标格局 (省级)</h3>
        <p>
          下方左侧地图展示了真实的省级数据。请使用控制条选择您关心的 **指标** 和 **年份**，观察其时空分布。
        </p>
        <p class="highlight">
          **（可选）点击任意省份**，在右侧“第二幕”中查看其单独的溢出效应。
        </p>
      </div>

      <div class="stats-card-container">
        <div
          class="stat-card"
          :class="{ placeholder: !selectedProvinceInfo }"
        >
          <span class="stat-label">当前查看省份</span>
          <span class="stat-value">{{
            selectedProvinceInfo?.name || '全国总览'
          }}</span>
        </div>
        <div
          class="stat-card"
          :class="{ placeholder: !selectedProvinceInfo }"
        >
          <span class="stat-label">{{ selectedYear }}年 {{ selectedMetricLabel }}</span>
          <span class="stat-value">{{
            selectedProvinceInfo?.metricValue || 'N/A'
          }}</span>
        </div>
        <div
          class="stat-card"
          :class="{ placeholder: !selectedProvinceInfo }"
        >
          <span class="stat-label">（模拟）溢出关系</span>
          <span class="stat-value">{{
            selectedProvinceInfo?.spilloverCount !== undefined
              ? selectedProvinceInfo.spilloverCount + ' 个'
              : 'N/A'
          }}</span>
        </div>
      </div>
      
      <div class="year-controls">
        <label>年份选择：</label>
        <div class="button-group">
          <button
            v-for="year in availableYears"
            :key="year"
            :class="{ active: year === selectedYear }"
            @click="selectedYear = year"
          >
            {{ year }}
          </button>
        </div>
      </div>

      <div class="metric-controls">
        <label for="metric-select">指标选择：</label>
        <select id="metric-select" v-model="selectedMetric">
          <option
            v-for="metric in provincialMetrics"
            :key="metric"
            :value="metric"
          >
            {{ metric?.split('(')[0] }} </option>
        </select>
      </div>
    </div>

    <div class="charts-grid-container" v-if="mapLoaded">
      <div class="chart-container">
        <div class="chart-title">
          真实数据：{{ selectedYear }}年 {{ selectedMetricLabel }}
        </div>
        <v-chart
          class="chart"
          :option="realDataMapOption"
          autoresize
          @click="handleMapClick"
          ref="realMapRef"
        />
      </div>

      <div class="chart-container">
        <div class="chart-title" ref="spilloverTitleRef">第二幕：空间溢出效应 (模拟)</div>
        <v-chart
          class="chart"
          :option="spilloverChartOption"
          autoresize
          ref="spilloverChartRef"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// 【✅ 核心修复 1/3】: 从 'vue' 导入 'provide'
import { ref, onMounted, reactive, watch, computed, provide } from 'vue'
import * as echarts from 'echarts'

// 导入 VChart 组件
import VChart from 'vue-echarts'

// 【✅ 核心修复 2/3】: 显式注入 echarts 实例，激活 VChart
provide('echarts', echarts)

// --- 模拟数据 (不变) ---
const provinceCoords = { 上海市: [121.48, 31.22], 北京市: [116.46, 39.92], 江苏省: [118.78, 32.04], 浙江省: [120.19, 30.26], 安徽省: [117.27, 31.86], 四川省: [104.06, 30.67], 湖北省: [114.31, 30.52], 广东省: [113.23, 23.16], 陕西省: [108.95, 34.27], 河北省: [114.48, 38.03], 新疆维吾尔自治区: [87.68, 43.77], 西藏自治区: [91.11, 29.97], 河南省: [113.65, 34.76], 山东省: [117.0, 36.65], }
const spilloverData = { 江苏省: [ { to: '上海市', effect: 'positive', value: 0.8 }, { to: '安徽省', effect: 'positive', value: 0.6 }, { to: '浙江省', effect: 'positive', value: 0.4 }, ], 北京市: [ { to: '河北省', effect: 'hiring', value: 0.7 }, { to: '上海市', effect: 'positive', value: 0.5 }, ], 四川省: [ { to: '湖北省', effect: 'positive', value: 0.5 }, { to: '陕西省', effect: 'positive', value: 0.4 }, { to: '西藏自治区', effect: 'hiring', value: 0.3 }, ], 广东省: [ { to: '湖北省', effect: 'positive', value: 0.6 }, { to: '上海市', effect: 'positive', value: 0.3 }, ], 上海市: [ { to: '浙江省', effect: 'positive', value: 0.9 }, { to: '江苏省', effect: 'positive', value: 0.7 }, { to: '安徽省', effect: 'positive', value: 0.5 }, ], 浙江省: [ { to: '安徽省', effect: 'positive', value: 0.5 }, { to: '上海市', effect: 'hiring', value: 0.4 }, ], 山东省: [ { to: '河北省', effect: 'positive', value: 0.4 }, { to: '河南省', effect: 'positive', value: 0.3 }, { to: '江苏省', effect: 'positive', value: 0.2 }, ], 陕西省: [ { to: '新疆维吾尔自治区', effect: 'positive', value: 0.5 }, { to: '河南省', effect: 'positive', value: 0.3 }, { to: '四川省', effect: 'hiring', value: 0.2 }, ], 湖北省: [ { to: '四川省', effect: 'positive', value: 0.4 }, { to: '河南省', effect: 'hiring', value: 0.3 }, { to: '安徽省', effect: 'positive', value: 0.2 }, ], }
// ------------------------------

// --- 响应式状态 ---
const mapLoaded = ref(false)
const realDataMapOption = ref({})
const allYearsData = ref({}) 
const availableYears = ref([]) 
const selectedYear = ref('2023') 
const selectedProvinceInfo = ref(null) 
const nationalData = ref(null) 
const nationalTransportOption = ref({}) 
const nationalTourismOption = ref({}) 

const provincialMetrics = ref([
  '全体居民人均可支配收入(元)', 
  '客运量(万人)', 
  '民用汽车拥有量(万辆)', 
  '高速等级公路里程(万公里)', 
  '铁路客运量(万人)', 
  '公路客运量(万人)', 
  '水运客运量(万人)', 
  '公路里程(万公里)', 
  '铁路营业里程(万公里)',
])
const selectedMetric = ref('全体居民人均可支配收入(元)')

const selectedMetricLabel = computed(() => selectedMetric.value?.split('(')[0])

const spilloverChartRef = ref(null)
const spilloverChartOption = ref({}) // 这个 ref 会被 init 和 update 两个函数操作
const spilloverTitleRef = ref(null) // 用于更新标题

const realMapRef = ref(null)
const currentHighlight = ref('')

// --- ECharts 样式配置 ---
const echartBaseTextStyle = {
  color: '#6e6e73',
  fontSize: 12,
}
const echartGrid = {
  top: '20%',
  left: '3%',
  right: '4%',
  bottom: '3%',
  containLabel: true,
}

// ----------------------------------------------------
// --- 【✅ 核心修复 3/3】: 重写图表初始化和点击逻辑 ---
// ----------------------------------------------------

// Geo 图表的统一样式，用于“总览”和“过滤”
const baseGeoOption = {
  backgroundColor: 'transparent',
  tooltip: {
    trigger: 'item',
    formatter: (params) => {
      if (params.componentType === 'series') {
        if (params.seriesType === 'lines') {
          return `${params.data.fromName} -> ${params.data.toName}<br/>强度: ${params.data.value}`;
        }
        if (params.seriesType === 'effectScatter') {
          return params.name;
        }
      }
      return params.name;
    }
  },
  geo: {
    map: 'china',
    roam: true,
    label: { show: false },
    itemStyle: {
      areaColor: '#f0f2f5',
      borderColor: '#d2d2d7',
      borderWidth: 0.5,
    },
    emphasis: {
      itemStyle: { areaColor: '#e0e0e0' }
    }
  }
}

/**
 * 【新】默认加载：显示全国总览流向图
 */
const initSpilloverChart = () => {
  const allLinks = [];
  const allNodes = new Map();

  // 1. 遍历所有数据，构建节点和链接
  for (const [sourceName, relationships] of Object.entries(spilloverData)) {
    const sourceCoord = provinceCoords[sourceName];
    if (!sourceCoord) continue;
    
    // 添加源节点
    if (!allNodes.has(sourceName)) {
      allNodes.set(sourceName, { name: sourceName, value: sourceCoord, itemStyle: { color: '#f87171' } }); // 源头统一红色
    }

    // 遍历关系
    relationships.forEach(rel => {
      const targetName = rel.to;
      const targetCoord = provinceCoords[targetName];
      if (!targetCoord) return;

      // 添加目标节点
      if (!allNodes.has(targetName)) {
         allNodes.set(targetName, { name: targetName, value: targetCoord, itemStyle: { color: '#6e6e73' } }); // 目标默认灰色
      }

      // 添加链接
      allLinks.push({
        fromName: sourceName,
        toName: targetName,
        coords: [sourceCoord, targetCoord],
        value: rel.value,
        lineStyle: {
          color: rel.effect === 'positive' ? '#4ade80' : '#f472b6',
          width: Math.max(1, rel.value * 3),
          curveness: 0.2
        }
      });
    });
  }

  const nodesData = Array.from(allNodes.values());

  // 2. 创建新 Option
  const newOption = {
    ...baseGeoOption,
    title: { text: '' }, // 不显示 ECharts 标题，我们用 HTML 标题
    series: [
      // 1. 所有节点
      {
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: nodesData,
        symbolSize: 10,
        label: { show: false } // 总览图不显示标签，太乱
      },
      // 2. 所有流向线
      {
        type: 'lines',
        coordinateSystem: 'geo',
        data: allLinks,
        effect: {
          show: true,
          period: 6,
          trailLength: 0.1,
          color: '#fff',
          symbol: 'arrow',
          symbolSize: 6
        },
        lineStyle: {
          opacity: 0.5,
          curveness: 0.2
        }
      }
    ]
  };

  // 3. 更新图表和标题
  if (spilloverTitleRef.value) {
    spilloverTitleRef.value.innerText = '第二幕：（模拟）全国溢出关系总览';
  }
  spilloverChartOption.value = newOption;
  // 此时 setOption 可能因为 ref 未就绪而失败，所以在 onMounted 中再次调用
  spilloverChartRef.value?.setOption(newOption, true);
}

/**
 * 【新】点击时：显示单个省份的流向图（过滤）
 */
const updateSpilloverChartForProvince = (provinceNameFull) => {
  const relationships = spilloverData[provinceNameFull]
  const sourceCoord = provinceCoords[provinceNameFull];

  if (!relationships || relationships.length === 0 || !sourceCoord) {
    // 如果该省无数据，也重置为总览
    initSpilloverChart();
    return;
  }

  const linesData = [];
  const targetNodes = [];
  
  // 1. 创建源节点
  const sourceNode = { name: provinceNameFull, value: sourceCoord, symbolSize: 20, itemStyle: { color: '#f87171' } };

  // 2. 遍历关系
  relationships.forEach((rel) => {
    const targetName = rel.to;
    const targetCoord = provinceCoords[targetName];
    
    if (targetCoord) {
      targetNodes.push({
        name: targetName,
        value: targetCoord,
        symbolSize: 15,
        itemStyle: { 
          color: rel.effect === 'positive' ? '#4ade80' : '#f472b6'
        }
      });

      linesData.push({
        fromName: provinceNameFull,
        toName: targetName,
        coords: [sourceCoord, targetCoord],
        value: rel.value,
        lineStyle: {
          color: rel.effect === 'positive' ? '#4ade80' : '#f472b6',
          width: Math.max(1, rel.value * 5),
          curveness: 0.2
        }
      });
    }
  });

  // 3. 创建新 Option
  const newOption = {
    ...baseGeoOption,
    title: { text: '' },
    series: [
      { // 源节点
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: [sourceNode],
        label: { show: true, formatter: '{b}', position: 'right', color: '#1d1d1f' }
      },
      { // 目标节点
        type: 'effectScatter',
        coordinateSystem: 'geo',
        data: targetNodes,
        label: { show: true, formatter: '{b}', position: 'right', color: '#1d1d1f' }
      },
      { // 流向线
        type: 'lines',
        coordinateSystem: 'geo',
        data: linesData,
        effect: {
          show: true,
          period: 6,
          trailLength: 0.7,
          color: '#fff',
          symbol: 'arrow',
          symbolSize: 10
        },
        lineStyle: {
          opacity: 0.7,
          curveness: 0.2
        }
      }
    ]
  };

  // 4. 更新图表和标题
  if (spilloverTitleRef.value) {
    spilloverTitleRef.value.innerText = `第二幕：（模拟）${provinceNameFull} 溢出效应`;
  }
  spilloverChartOption.value = newOption;
  spilloverChartRef.value?.setOption(newOption, true);
}


/**
 * 【新】总控制器：处理地图点击
 */
const handleMapClick = (params) => {
  const provinceNameFull = params.name;

  if (provinceNameFull) {
    // --- 点击了省份 ---
    // 1. 高亮左侧地图
    if (currentHighlight.value) {
      realMapRef.value?.dispatchAction({ type: 'downplay', name: currentHighlight.value });
    }
    realMapRef.value?.dispatchAction({ type: 'highlight', name: provinceNameFull });
    currentHighlight.value = provinceNameFull;

    // 2. 更新统计卡
    updateSelectedProvinceInfo(provinceNameFull);

    // 3. 更新右侧图表（过滤）
    updateSpilloverChartForProvince(provinceNameFull);

  } else {
    // --- 点击了空白区域 ---
    // 1. 取消高亮
    if (currentHighlight.value) {
      realMapRef.value?.dispatchAction({ type: 'downplay', name: currentHighlight.value });
    }
    currentHighlight.value = '';

    // 2. 清空统计卡
    selectedProvinceInfo.value = null;

    // 3. 重置右侧图表（总览）
    initSpilloverChart();
  }
}

// ----------------------------------------------------
// --- (END) 修复逻辑结束 ---
// ----------------------------------------------------


onMounted(() => {
  initPageData()
})

const initPageData = async () => {
  try {
    const [mapRes, dataRes, nationalDataRes] = await Promise.all([
      fetch('/map/china.json'),
      fetch('/data/merged_provincial_data.json'),
      fetch('/data/yeardatas_converted.json')
    ])
    
    if (!mapRes.ok) throw new Error('china.json 加载失败')
    if (!dataRes.ok) throw new Error('merged_provincial_data.json 加载失败')
    if (!nationalDataRes.ok) throw new Error('yeardatas_converted.json 加载失败')

    const chinaJson = await mapRes.json()
    echarts.registerMap('china', chinaJson)
    
    const provincialData = await dataRes.json()
    nationalData.value = await nationalDataRes.json() 
    
    processAllYearsData(provincialData)
    
    mapLoaded.value = true 

    // 【重要】: 页面加载后，立即初始化所有图表
    
    // 宏观图表
    setNationalTransportChart()
    setNationalTourismChart()
    
    // 第一幕：真实数据
    updateRealDataMapOption() 
    
    // 第二幕：溢出总览 (不再是空)
    // 需要延迟一点点，确保 VChart ref 已经准备好
    setTimeout(() => {
        initSpilloverChart();
    }, 100);

  } catch (error) {
    console.error('地图或数据加载失败:', error)
    mapLoaded.value = false
  }
}

/* --- ( START ) 此处函数保持不变 --- */
function extractNationalSeries(metricName) {
  if (!nationalData.value || !nationalData.value[metricName]) {
    console.warn(`指标 ${metricName} 在 nationalData 中未找到。`)
    return { data: [], years: [] }
  }
  const data = nationalData.value[metricName].filter(d => d.年份 !== '2024');
  const years = data.map(d => d['年份']).reverse()
  const values = data.map(d => d['数值']).reverse()
  return { data: values, years: years }
}

function setNationalTransportChart() {
  const { data: highwayData, years } = extractNationalSeries('公路里程(万公里)')
  const { data: railwayData } = extractNationalSeries('铁路营业里程(万公里)')
  const { data: expresswayData } = extractNationalSeries('高速等级路公路里程(万公里)')

  nationalTransportOption.value = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['公路里程', '铁路营业里程', '高速公路里程'],
      top: '5%',
      textStyle: { color: '#1d1d1f' }, 
      inactiveColor: '#999999'
    },
    grid: echartGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      axisLine: { lineStyle: { color: '#d2d2d7' } }, 
      axisLabel: echartBaseTextStyle, 
    },
    yAxis: {
      type: 'value',
      name: '万公里',
      nameTextStyle: echartBaseTextStyle, 
      axisLabel: echartBaseTextStyle, 
      splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, 
    },
    series: [
      { name: '公路里程', type: 'line', smooth: true, data: highwayData, color: '#38bdf8' },
      { name: '铁路营业里程', type: 'line', smooth: true, data: railwayData, color: '#f87171' },
      { name: '高速公路里程', type: 'line', smooth: true, data: expresswayData, color: '#4ade80' },
    ],
  }
}

function setNationalTourismChart() {
  const { data: tourismSpendingData, years } = extractNationalSeries('国内旅游人均花费(元)')
  const { data: tourismCountData } = extractNationalSeries('国内游客(百万人次)')
  const { data: incomeData } = extractNationalSeries('居民人均可支配收入(元)')
  
  nationalTourismOption.value = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['旅游人均花费(元)', '人均可支配收入(元)', '国内游客(百万人次)'],
      top: '5%',
      textStyle: { color: '#1d1d1f' }, 
      inactiveColor: '#999999'
    },
    grid: echartGrid,
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      axisLine: { lineStyle: { color: '#d2d2d7' } }, 
      axisLabel: echartBaseTextStyle, 
    },
    yAxis: [
      {
        type: 'value',
        name: '元',
        nameTextStyle: echartBaseTextStyle, 
        axisLabel: echartBaseTextStyle, 
        splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, 
      },
      {
        type: 'value',
        name: '百万人次',
        nameTextStyle: echartBaseTextStyle, 
        axisLabel: echartBaseTextStyle, 
        splitLine: { show: false },
      },
    ],
    series: [
      { name: '旅游人均花费(元)', type: 'line', yAxisIndex: 0, smooth: true, data: tourismSpendingData, color: '#f472b6' },
      { name: '人均可支配收入(元)', type: 'line', yAxisIndex: 0, smooth: true, data: incomeData, color: '#fde047' },
      { name: '国内游客(百万人次)', type: 'line', yAxisIndex: 1, smooth: true, data: tourismCountData, color: '#38bdf8' },
    ],
  }
}

 function processAllYearsData(data) {
  const yearDataMap = {}
  const years = new Set()
  
  for (const provinceName in data) {
    const provinceHistory = data[provinceName]
    
    provinceHistory.forEach(yearData => {
      const year = yearData['年份']
      if (year === '2024') return;
      years.add(year)

      if (!yearDataMap[year]) {
        yearDataMap[year] = {}
      }
      
      for (const metric of provincialMetrics.value) {
        if (!yearDataMap[year][metric]) {
          yearDataMap[year][metric] = []
        }
        
        const value = yearData[metric];
        if (value != null && !isNaN(value)) {
          yearDataMap[year][metric].push({ 
            name: provinceName, 
            value: parseFloat(value) 
          })
        }
      }
    })
  }
  
  allYearsData.value = yearDataMap
  availableYears.value = Array.from(years).sort().reverse().filter(y => parseInt(y) >= 2018) 
  if (availableYears.value.length > 0 && !availableYears.value.includes(selectedYear.value)) {
    selectedYear.value = availableYears.value[0] 
  }
}

 function updateRealDataMapOption() {
  const dataForYearAndMetric = allYearsData.value[selectedYear.value]?.[selectedMetric.value] || []
  
  const validValues = dataForYearAndMetric.map(d => d.value).filter(v => v != null && !isNaN(v)); 
  const values = validValues.length > 0 ? validValues : [0]
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

  realDataMapOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        const value = params.data ? params.data.value : null;
        const year = selectedYear.value;
        const name = params.name;
        if (value != null && !isNaN(value)) {
          return `${name}<br/>${year} ${selectedMetricLabel.value}: ${value.toFixed(2)}`;
        } else {
          return `${name}<br/>${year} ${selectedMetricLabel.value}: N/A`;
        }
      }
    },
    visualMap: {
      type: 'continuous',
      min: minVal,
      max: maxVal,
      left: '10',
      bottom: '10',
      text: ['高', '低'],
      textStyle: { color: '#1d1d1f' }, 
      inRange: {
        color: ['#f0f2f5', '#007aff', '#f87171'], 
      },
      calculable: true, 
    },
    series: [
      {
        type: 'map',
        map: 'china',
        roam: false,
        itemStyle: {
          areaColor: '#f9f9f9', 
          borderColor: '#d2d2d7', 
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: { areaColor: '#fde047' }, 
          label: { color: '#000' } 
        },
        data: dataForYearAndMetric,
      },
    ],
  }
}

watch(selectedYear, updateRealDataMapOption)
watch(selectedMetric, () => {
  updateRealDataMapOption()
  if (selectedProvinceInfo.value) {
    updateSelectedProvinceInfo(selectedProvinceInfo.value.name)
  }
})

const updateSelectedProvinceInfo = (provinceNameFull) => {
  const relationships = spilloverData[provinceNameFull] 
  
  const metricData = allYearsData.value[selectedYear.value]?.[selectedMetric.value] || []
  const metricValueRaw = metricData.find(d => d.name === provinceNameFull)?.value 
  let metricValueFormatted = 'N/A'
  if (metricValueRaw != null && !isNaN(metricValueRaw)) {
    metricValueFormatted = metricValueRaw.toFixed(
      metricValueRaw > 100 ? 0 : 2
    )
  }

  selectedProvinceInfo.value = {
    name: provinceNameFull,
    metricValue: metricValueFormatted,
    spilloverCount: relationships ? relationships.length : 0,
  }
}
/* --- ( END ) 此处函数保持不变 --- */
</script>

<style scoped>
/* 定义 Page 自己的主题色 (红色) */
.spatial-page {
  --page-accent: #f87171;
}

.page-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 1rem 2rem;
}

.page-header {
  margin-bottom: 1.5rem;
}
.page-header h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, var(--page-accent) 0%, var(--text-color) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header p {
  font-size: 1.1rem;
  color: var(--text-color-light);
  max-width: 800px;
}

/* --- 全国宏观图表样式 --- */
.page-header.secondary {
  margin-top: 2rem;
  margin-bottom: 1.5rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 1rem;
}
.page-header.secondary h2 {
  font-size: 1.75rem;
  font-weight: 600;
  color: var(--text-color); 
  margin-bottom: 0.25rem;
}
.national-charts-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}
.charts-grid-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* 响应式网格 */
@media (min-width: 1024px) {
  .national-charts-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .charts-grid-container {
    grid-template-columns: repeat(2, 1fr);
  }
}


/* 通用图表容器样式 */
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
.chart-container.small {
  height: 400px;
}
.charts-grid-container .chart-container {
  height: 650px;
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

/* --- 省级控制面板 --- */
.controls-and-stats-wrapper {
  display: grid;
  grid-template-columns: 1fr; /* 移动端默认为 1 列 */
  gap: 1.5rem;
  background-color: var(--sidebar-bg); 
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color); 
  margin-bottom: 1.5rem;
  margin-top: 2rem; 
}

/* 在中等屏幕及以上变为 2 列布局 */
@media (min-width: 1024px) {
  .controls-and-stats-wrapper {
    grid-template-columns: 1fr 1.5fr; /* 叙事区 | 统计卡 */
    grid-template-rows: auto auto;    /* 自动两行 */
  }
}

.narrative-box {
  border-bottom: 1px solid var(--border-color); /* 在移动端使用底部边框 */
  padding-bottom: 1.5rem;
}
.narrative-box h3 {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--page-accent); 
  margin-bottom: 0.5rem;
}
.narrative-box p {
  font-size: 0.95rem;
  color: var(--text-color-light);
  margin-bottom: 0.5rem;
}
.narrative-box .highlight {
  color: var(--page-accent); 
  font-size: 1rem;
}

.stats-card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); /* 响应式统计卡 */
  gap: 1rem;
  align-items: center;
}
.stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: var(--bg-color); 
  border-radius: 8px;
  padding: 1rem;
  height: 100px; /* 固定高度 */
  border-left: 4px solid var(--page-accent); 
  transition: all 0.3s ease;
}
.stat-card.placeholder {
  opacity: 0.6;
  border-left-color: var(--border-color);
}
.stat-label {
  font-size: 0.85rem;
  color: var(--text-color-light);
  margin-bottom: 0.25rem;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color); 
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.year-controls, .metric-controls {
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
  margin-top: 1rem;
  display: flex;
  flex-direction: column; /* 移动端堆叠 */
  align-items: flex-start;
  gap: 0.5rem;
}
.year-controls label, .metric-controls label {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 0.5rem;
}
.button-group {
  display: flex;
  flex-wrap: wrap; /* 允许按钮换行 */
  gap: 0.5rem;
}
.button-group button {
  padding: 0.5rem 1rem;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color-light);
  background-color: var(--bg-color); 
  border: 1px solid var(--border-color);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
}
.button-group button:hover {
  background-color: var(--border-color); 
  color: var(--text-color); 
}
.button-group button.active {
  background-color: var(--page-accent); 
  color: #fff; 
  border-color: var(--page-accent); 
}

/* 【HCI 改进】指标选择器样式 */
.metric-controls select {
  width: 100%; /* 占满 */
  padding: 0.5rem;
  font-size: 1rem;
  background-color: var(--bg-color); 
  color: var(--text-color);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  font-family: inherit;
}

/* 响应式调整控制面板 */
@media (min-width: 1024px) {
  .narrative-box {
    grid-column: 1 / 2;
    grid-row: 1 / 3; /* 叙事区占据两行高 */
    border-right: 1px solid var(--border-color);
    border-bottom: none;
    padding-bottom: 0;
    padding-right: 1.5rem;
  }
  .stats-card-container {
    grid-column: 2 / 3;
    grid-row: 1 / 2;
  }
  .year-controls {
    grid-column: 2 / 3;
    grid-row: 2 / 3;
    flex-direction: row; /* 恢复水平布局 */
    align-items: center;
    gap: 1rem;
    margin-top: 0;
    padding-top: 1.5rem;
  }
  .metric-controls {
    grid-column: 1 / -1; /* 跨越所有列 */
    grid-row: 3 / 4;
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
  .metric-controls select {
    width: auto;
    flex-grow: 1;
  }
}


/* --- 通用提示框 --- */
.warning {
  background-color: #fff5f5;
  border: 1px solid #f87171;
  color: #c53030;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  margin-bottom: 1.5rem;
}
.info {
  background-color: rgba(0, 122, 255, 0.05);
  border-left: 4px solid var(--accent-color);
  color: var(--text-color-light);
  border-radius: 4px;
  padding: 0.5rem 1rem;
  margin-bottom: 1rem; 
  font-size: 0.9rem;
  z-index: 5;
  position: relative;
}
</style>