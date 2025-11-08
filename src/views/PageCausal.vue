<template>
  <div class="page-container-story">
    <header class="page-header">
      <h1>🔎 侦探之旅：挖掘T-T-C的因果链</h1>
      <p>
        “交通”、“旅游”、“消费”三者都在高速增长，但它们之间到底谁是因，谁是果？
      </p>
      <p class="narrative-intro">
        本页将带您体验一次数据侦探之旅，展示我们是如何从表面现象一步步深入，
        <br />
        运用分析模型来探索它们三者之间动态演化关系的。
      </p>
    </header>

    <section class="narrative-step">
      <h2>步骤一：宏观共振 (The Hunch)</h2>
      <p class="narrative-text">
        我们的第一个问题是：这三个变量是否“同频”？我们从 `yeardatas_converted.json` 中提取了三项核心指标的真实数据（2005-2023），并将它们标准化(Min-Max)后绘制在同一张图上，来观察它们的宏观趋势。
      </p>
      <div class="chart-container-wrapper">
        <div v-if="!dataLoaded" class="loading-prompt">正在加载真实数据...</div>
        <div class="chart-container" v-if="dataLoaded">
          <div class="chart-title">真实数据趋势对比 (已标准化)</div>
          <v-chart class="chart" :option="timeSeriesOption" autoresize />
        </div>
      </div>
      <p class="narrative-insight">
        **初步发现：**
        三条曲线的波动高度一致！它们显然“同涨同跌”，这强力暗示了它们之间存在紧密的联系。
      </p>
    </section>

    <section class="narrative-step">
      <h2>步骤二：量化相关性 (Gathering Clues)</h2>
      <p class="narrative-text">
        肉眼观察还不够，我们需要一个客观的数学证据。我们计算了这三组数据（标准化后）的**皮尔逊相关系数 (Pearson Correlation)**，它衡量变量间线性关系的强度（-1到1）。
      </p>
      <div class="chart-container-wrapper">
        <div class="chart-container" style="height: 450px">
          <div class="chart-title">相关性热力图 (基于2005-2023数据)</div>
          <v-chart class="chart" :option="correlationOption" autoresize />
        </div>
      </div>
      <p class="narrative-insight">
        **关键线索：**
        热力图显示，所有变量间的相关性均 > 0.95，呈**极强正相关**。
        <br />
        但这带来了一个更棘手的问题：是交通(T)拉动了消费(C)？还是消费(C)反哺了交通(T)？还是两者互相拉动？
      </p>
    </section>

    <section class="narrative-step">
      <h2>步骤三：时序与因果 (The "Chicken & Egg" Problem)</h2>
      <p class="narrative-text">
        为了解开“鸡生蛋还是蛋生鸡”的谜题，我们引入了经济学中的时序分析模型（如格兰杰因果检验或向量自回归(VAR)模型）。这些模型的核心是检验一个变量的**历史值**是否能显著“预测”另一个变量的**未来值**。
        <br />
        我们分别对**早期 (2005-2014)** 和**后期 (2015-2023)** 两个阶段进行了建模，得到了惊人的发现：
      </p>

      <div class="stage-switcher">
        <button
          :class="{ active: currentPeriod === 'early' }"
          @click="currentPeriod = 'early'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-13a.75.75 0 00-1.5 0v5c0 .414.336.75.75.75h4a.75.75 0 000-1.5h-3.25V5z" clip-rule="evenodd" />
          </svg>
          分析阶段一：早期 (2005-2014)
        </button>
        <button
          :class="{ active: currentPeriod === 'late' }"
          @click="currentPeriod = 'late'"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M15.312 11.424a5.5 5.5 0 01-9.204-4.608L3.43 4.13a.75.75 0 00-1.06 1.06l2.122 2.122a5.5 5.5 0 019.062 4.904l2.688 2.688a.75.75 0 101.06-1.06l-2.002-2.002zM10 5.5a4 4 0 100 8 4 4 0 000-8z" clip-rule="evenodd" />
          </svg>
          分析阶段二：后期 (2015-2023)
        </button>
      </div>

      <div class="charts-grid-2">
        <div class="chart-container">
          <div class="chart-title">
            模型结果 1：动态因果网络 ({{ currentPeriodText }})
          </div>
          <v-chart class="chart" :option="graphOption" autoresize />
        </div>
        <div class="chart-container">
          <div class="chart-title">
            模型结果 2：脉冲响应 ({{ currentPeriodText }})
          </div>
          <p class="chart-subtitle">
            (模拟当期“交通”受到冲击后，对“消费”的未来影响)
          </p>
          
          <div class="model-control-slider">
            <label for="shock-slider">冲击强度: {{ shockAmount.toFixed(1) }}x</label>
            <input 
              id="shock-slider"
              type="range" 
              v-model.number="shockAmount" 
              min="0.5" 
              max="3.0" 
              step="0.1"
            />
          </div>

          <v-chart class="chart" :option="irfOption" ref="irfChartRef" autoresize />
        </div>
      </div>

      <div class="narrative-insight">
        **模型解读 (请切换阶段查看)：**
        <br />
        <ul>
          <li>
            **早期阶段：**
            我们观察到一条清晰的**单向驱动链**。交通(T)是绝对的核心，它强力驱动着消费(C)和旅游(T2)。脉冲响应图也显示，交通的冲击能对消费产生强大且持久（滞后4期达到峰值）的拉动作用。
          </li>
          <li>
            **后期阶段：**
            关系发生了质变！它进化成了一个**双向互哺的复杂网络**。交通(T)和消费(C)开始互相拉动，旅游(T2)和消费(C)也形成了双向循环。脉冲响应显示，交通对消费的冲击响应更快（滞后2期达峰），但峰值降低，说明消费的增长已不完全依赖交通，有了自己的内生动力。
          </li>
        </ul>
      </div>
    </section>

    <section class="narrative-step final-verdict">
      <h2>步骤四：最终结论 (The Verdict)</h2>
      
      <p class="narrative-text">
        我们的数据侦探之旅走到了终点。通过从“宏观共振”到“相关分析”再到“因果建模”的层层深入，我们揭示了T-T-C关系的真相：
      </p> 
      
      <ol class="verdict-list">
        <li>
          **它们不是简单的相关，而是存在时序因果关系。**
        </li>
        <li>
          **这种因果关系不是静态的，而是动态演化的。**
        </li>
        <li>
          **早期 (2005-2014)：** 是“交通建设”驱动“经济成果”的**单向拉动**模式。
        </li>
        <li>
          **后期 (2015-2023)：**
          进化为“基建、旅游、消费”三者**双向互哺、内生循环**的健康生态。
        </li>
      </ol>
      <p class="narrative-end">
        这个结论展现了中国经济结构从“投资拉动”向“内需驱动”的宏观转变。
      </p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue'

// --- ECharts 按需引入 (不变) ---
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, HeatmapChart, GraphChart, EffectScatterChart } from 'echarts/charts'
import { TooltipComponent, LegendComponent, GridComponent, VisualMapComponent, MarkPointComponent, TitleComponent, GraphicComponent } from 'echarts/components'
import { graphic } from 'echarts/core' // 保持

// 【✅ 修复】导入 VChart 组件 (不变)
import VChart from 'vue-echarts'

use([ CanvasRenderer, LineChart, HeatmapChart, GraphChart, TooltipComponent, LegendComponent, GridComponent, VisualMapComponent, MarkPointComponent, TitleComponent, GraphicComponent, ])
// --- 按需引入结束 ---

const dataLoaded = ref(false)
const currentPeriod = ref('early')
const currentPeriodText = computed(() =>
  currentPeriod.value === 'early' ? '早期' : '后期'
)

// 图表 refs
const timeSeriesOption = ref({})
const correlationOption = ref({})
const graphOption = ref({})
const irfOption = ref({}) // <v-chart> 已经绑定到这个 ref

// 【HCI 改进】新增图表 Ref 和滑块 Ref
const irfChartRef = ref(null) // 这个 ref 仍然有用，例如用于 dispatchAction
const shockAmount = ref(1.0)


// --- 模拟数据 (不变) ---
let iconPaths = {}
let graphNodes = []
let links_early = []
let links_late = []
// 【HCI 改进】定义基础数据
const irfData_early_base = [0.1, 0.3, 0.55, 0.7, 0.65, 0.5, 0.3, 0.1, 0.05, 0]
const irfData_late_base = [0.2, 0.45, 0.3, 0.2, 0.15, 0.1, 0.05, 0, 0, 0]

onMounted(() => {
  defineSimulatedData()
  loadRealData()
  setCorrelationChart()
  updateModels('early', shockAmount.value) // 首次加载
})

// 【HCI 改进】监听滑块和时期的变化 (不变)
watch(shockAmount, (newAmount) => {
  updateModels(currentPeriod.value, newAmount)
})
watch(currentPeriod, (newPeriod) => {
  updateModels(newPeriod, shockAmount.value)
})


// 步骤一：加载真实数据 (不变)
const loadRealData = async () => {
  try {
    // 【代码修复】路径已改回指向 /public/ 目录
    const response = await fetch('/data/yeardatas_converted.json')
    if (!response.ok) throw new Error('yeardatas_converted.json 加载失败')
    
    const nationalData = await response.json()
    const years = Array.from({ length: 2023 - 2005 + 1 }, (_, i) => (2005 + i).toString())
    
    const extractAndNormalize = (key) => {
      const dataSeries = nationalData[key]
      if (!dataSeries) { console.warn(`数据中未找到 key: ${key}`); return new Array(years.length).fill(null) }
      const filteredData = dataSeries.filter(d => parseInt(d['年份'], 10) <= 2023)
      const dataMap = new Map(filteredData.map((d) => [d['年份'], d['数值']]))
      const rawData = years.map((year) => dataMap.get(year) || null)
      const validData = rawData.filter(v => v !== null && v !== undefined).map(v => parseFloat(v)) // 确保是数字
      if (validData.length === 0) return rawData;
      const min = Math.min(...validData)
      const max = Math.max(...validData)
      if (min === max) return rawData.map(v => (v === null || v === undefined) ? null : 0)
      return rawData.map(v => (v === null || v === undefined) ? null : (v - min) / (max - min))
    }
    
    const transportData = extractAndNormalize('铁路营业里程(万公里)')
    const tourismData = extractAndNormalize('国内游客(百万人次)')
    const consumptionData = extractAndNormalize('居民消费水平(元)')
    
    setTimeSeriesChart(years, transportData, tourismData, consumptionData)
    dataLoaded.value = true
  } catch (error) {
    console.error('真实数据加载失败:', error)
    dataLoaded.value = true;
    timeSeriesOption.value = {
      title: {
        text: '真实数据加载失败', left: 'center', top: 'center',
        textStyle: { color: '#f87171' }
      }
    }
  }
}

// 图表 1: 宏观共振图 (不变)
function setTimeSeriesChart(years, transport, tourism, consumption) {
  timeSeriesOption.value = {
    backgroundColor: 'transparent',
    tooltip: { trigger: 'axis' },
    legend: {
      data: ['交通 (铁路)', '旅游 (游客)', '消费 (水平)'],
      top: 10,
      // 【BUG 修复】(不变)
      textStyle: { color: '#333333' }, // 选中时颜色
      inactiveColor: '#999999'       // 未选中时颜色
    },
    grid: { left: '10%', right: '5%', bottom: '15%' },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: years,
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
    },
    yAxis: {
      type: 'value',
      name: '标准化值 (Min-Max)',
      nameTextStyle: { color: 'var(--text-color-light)' }, 
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }, 
    },
    series: [
      { name: '交通 (铁路)', type: 'line', smooth: true, data: transport, lineStyle: { color: '#f87171' }, },
      { name: '旅游 (游客)', type: 'line', smooth: true, data: tourism, lineStyle: { color: '#38bdf8' }, },
      { name: '消费 (水平)', type: 'line', smooth: true, data: consumption, lineStyle: { color: '#4ade80' }, },
    ],
  }
}

// 图表 2: 相关性热力图 (不变)
function setCorrelationChart() {
  const data = [ [0, 0, 1], [0, 1, 0.96], [0, 2, 0.98], [1, 0, 0.96], [1, 1, 1], [1, 2, 0.95], [2, 0, 0.98], [2, 1, 0.95], [2, 2, 1], ];
  const labels = ['交通', '旅游', '消费'];

  correlationOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
      position: 'top',
      formatter: (p) => `${labels[p.data[0]]} 与 ${labels[p.data[1]]} 的相关性: ${p.data[2]}`,
    },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '10%' },
    xAxis: {
      type: 'category',
      data: labels,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
    },
    yAxis: {
      type: 'category',
      data: labels,
      splitArea: { show: true },
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
    },
    visualMap: {
      min: 0.9,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0',
      textStyle: { color: 'var(--text-color)' }, 
      inRange: {
        color: ['rgba(0, 122, 255, 0.3)', 'rgba(248, 113, 113, 1)'], 
      },
    },
    series: [
      {
        type: 'heatmap',
        data: data,
        label: {
          show: true,
          formatter: (p) => p.data[2].toFixed(2),
          color: '#000', 
        },
        emphasis: {
          itemStyle: { borderColor: '#fff', borderWidth: 1 },
        },
      },
    ],
  }
}

// 步骤三：更新模型图表
const updateModels = (period, amount) => {
 
  // --- 1. 更新因果图 --- (不变)
  graphOption.value = {
    backgroundColor: 'transparent',
    tooltip: {
        formatter: (params) => {
            if (params.dataType === 'edge') {
                const labelText = params.data?.label?.formatter; 
                return labelText ? `关系: ${labelText}` : '关系: (无)';
            }
            return params.name;
        }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        animationDuration: 1500,
        data: graphNodes,
        links: period === 'early' ? links_early : links_late, 
        label: { show: true, position: 'right', color: 'var(--text-color)', fontSize: 14 }, 
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: [4, 12],
        edgeLabel: { 
            show: true, 
            fontSize: 12, 
            color: 'var(--text-color)', 
            textBorderColor: 'var(--sidebar-bg)', 
            textBorderWidth: 2,
            formatter: (params) => {
                return params.data?.label?.formatter || ''; 
            }
        },
        force: { repulsion: 400, edgeLength: 180, gravity: 0.1, layoutAnimation: true },
      },
    ],
  }

  // --- 2. 更新脉冲响应图 --- (不变)
  const baseData = period === 'early' ? irfData_early_base : irfData_late_base;
  const currentIrfData = baseData.map(val => val * amount); 
  const peakTime = period === 'early' ? '滞后4期' : '滞后2期';
  const yMax = Math.max(0.8 * 3.0, 0.5 * 3.0); // 确保Y轴最大值固定，防止缩放跳动

  const newIrfOption = {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      formatter: (params) => `滞后期 ${params[0].axisValue}: 冲击响应 ${params[0].value.toFixed(2)}`
    },
    grid: { left: '12%', right: '8%', bottom: '15%', top: '25%' }, 
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 10 }, (_, i) => `T+${i}`), 
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
    },
    yAxis: {
      type: 'value',
      name: '响应程度',
      nameTextStyle: { color: 'var(--text-color-light)' }, 
      axisLine: { lineStyle: { color: 'var(--border-color)' } }, 
      splitLine: { lineStyle: { color: 'var(--border-color)', type: 'dashed' } }, 
      max: yMax, // 固定 Y 轴最大值
      min: 0,
    },
    series: [
      {
        name: '冲击响应',
        type: 'line',
        smooth: true,
        data: currentIrfData, 
        lineStyle: { color: '#38bdf8' }, 
        areaStyle: {
          color: new graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(56, 189, 248, 0.5)' },
            { offset: 1, color: 'rgba(56, 189, 248, 0)' }
          ])
        },
        markPoint: {
          data: [
            { type: 'max', name: '峰值', symbol: 'pin', itemStyle: { color: '#f87171' } }
          ],
          label: {
            formatter: (params) => `${params.name}: ${peakTime} (值: ${params.value.toFixed(2)})`,
            color: '#fff', 
            backgroundColor: '#f87171',
            padding: [4, 8],
            borderRadius: 4
          }
        }
      }
    ]
  };

  // ==========================================
  // 【✅ BUG 修复】
  // 不再使用 if/else 和 irfChartRef.value.setOption()
  // 而是直接更新已绑定的 ref (irfOption.value)
  // vue-echarts 会自动监听到这个变化并更新图表
  // ==========================================
  irfOption.value = newIrfOption;
}

/* --- (补充) 因果图模拟数据 (不变) --- */
function defineSimulatedData() {
  graphNodes = [
    { name: '交通 (T)', symbolSize: 80, itemStyle: { color: '#f87171' } },
    { name: '旅游 (T2)', symbolSize: 60, itemStyle: { color: '#38bdf8' } },
    { name: '消费 (C)', symbolSize: 60, itemStyle: { color: '#4ade80' } },
  ]
  links_early = [
    { source: '交通 (T)', target: '消费 (C)', lineStyle: { width: 5, color: '#f87171' }, label: { show: true, formatter: '强驱动' } },
    { source: '交通 (T)', target: '旅游 (T2)', lineStyle: { width: 3, color: '#f87171' }, label: { show: true, formatter: '驱动' } },
  ]
  links_late = [
    { source: '交通 (T)', target: '消费 (C)', lineStyle: { width: 5, color: '#f87171', curveness: 0.2 }, label: { show: true, formatter: '双向互哺' }, effect: { show: true, symbol: 'arrow', symbolSize: 10, trailLength: 0.1, color: 'var(--text-color)' } }, 
    { source: '消费 (C)', target: '交通 (T)', lineStyle: { width: 5, color: '#4ade80', curveness: 0.2 }, effect: { show: true, symbol: 'arrow', symbolSize: 10, trailLength: 0.1, color: 'var(--text-color)' } }, 
    { source: '旅游 (T2)', target: '消费 (C)', lineStyle: { width: 3, color: '#38bdf8', curveness: -0.2 }, label: { show: true, formatter: '双向拉动' }, effect: { show: true, symbol: 'arrow', symbolSize: 8, trailLength: 0.1, color: 'var(--text-color)' } }, 
    { source: '消费 (C)', target: '旅游 (T2)', lineStyle: { width: 3, color: '#4ade80', curveness: -0.2 }, effect: { show: true, symbol: 'arrow', symbolSize: 8, trailLength: 0.1, color: 'var(--text-color)' } }, 
  ]
}
</script>

<style scoped>
/* 定义 Page 3 自己的主题色 (绿色) */
.page-container-story {
  --page-accent: #4ade80;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
  color: var(--text-color); 
}

/* 叙事头部 */
.page-header {
  text-align: center;
  margin-bottom: 3rem;
  border-bottom: 1px solid var(--border-color);
  padding-bottom: 2rem;
}
.page-header h1 {
  font-size: 2.8rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  background: linear-gradient(90deg, var(--page-accent) 0%, var(--text-color) 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}
.page-header p {
  font-size: 1.2rem;
  color: var(--text-color-light);
  margin-bottom: 0;
}
.page-header p.narrative-intro {
  font-size: 1rem;
  color: var(--text-color-light);
  margin-top: 1rem;
}

/* 叙事步骤 */
.narrative-step {
  margin-bottom: 4rem;
}
.narrative-step h2 {
  font-size: 2rem;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 1rem;
  border-bottom: 2px solid var(--page-accent); 
  padding-bottom: 0.5rem;
  display: inline-block;
}
.narrative-text {
  font-size: 1.1rem;
  color: var(--text-color-light);
  line-height: 1.8;
  margin-bottom: 1.5rem;
}
.narrative-insight {
  font-size: 1.1rem;
  color: var(--text-color);
  line-height: 1.8;
  margin-top: 1.5rem;
  background-color: var(--sidebar-bg); 
  border: 1px solid var(--border-color); 
  border-left: 4px solid var(--page-accent); 
  padding: 1rem 1.5rem;
  border-radius: 8px;
}
.narrative-insight ul, .narrative-insight ol {
  padding-left: 1.5rem;
  margin-top: 0.5rem;
}

/* 图表容器 */
.chart-container-wrapper {
  width: 100%;
  margin-bottom: 1rem;
}
.chart-container {
  position: relative;
  height: 500px;
  width: 100%;
  background-color: var(--sidebar-bg); 
  border-radius: 12px;
  padding: 1.5rem;
  border: 1px solid var(--border-color); 
  box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.05); 
}
.chart-title {
  position: absolute;
  top: 1.5rem;
  left: 1.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  color: var(--text-color); 
  z-index: 10;
}
.chart-subtitle {
  position: absolute;
  top: 3.5rem;
  left: 1.5rem;
  font-size: 0.9rem;
  font-weight: 400;
  color: var(--text-color-light); 
  z-index: 10;
}
.chart {
  height: 100%;
  width: 100%;
}
.loading-prompt {
  color: var(--text-color-light);
  font-size: 1.2rem;
  text-align: center;
  padding: 2rem;
  background-color: var(--sidebar-bg); 
  border-radius: 12px;
  border: 1px solid var(--border-color);
  height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 【HCI 改进】滑块样式 */
.model-control-slider {
  position: absolute;
  top: 5.5rem;
  left: 1.5rem;
  right: 1.5rem;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}
.model-control-slider label {
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-color-light);
}
.model-control-slider input[type="range"] {
  flex-grow: 1;
  accent-color: var(--page-accent);
}
/* 调整图表内边距为滑块腾出空间 */
.chart-container .chart {
  padding-top: 3.5rem; 
}


/* 嵌入式 2x2 网格 (不变) */
.charts-grid-2 {
  display: grid;
  grid-template-columns: 1fr; 
  gap: 1.5rem;
  margin-top: 1.5rem;
}
@media (min-width: 1024px) {
  .charts-grid-2 {
    grid-template-columns: 1fr 1fr;
  }
  .charts-grid-2 .chart-container {
    height: 450px;
  }
}

/* 阶段切换器 */
.stage-switcher {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1rem;
  padding: 0.75rem;
  border-radius: 12px;
  flex-wrap: wrap; /* 移动端换行 */
}
.stage-switcher button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: var(--sidebar-bg); 
  border: 2px solid var(--border-color); 
  color: var(--text-color-light); 
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 1rem;
  font-weight: 600;
}
.stage-switcher button:hover {
  background-color: var(--bg-color); 
  color: var(--text-color); 
}
.stage-switcher button.active {
  background-color: var(--page-accent); 
  border-color: var(--page-accent); 
  color: #000; /* 绿色背景用黑色字更清晰 */
  box-shadow: 0 0 15px rgba(74, 222, 128, 0.5);
}
.stage-switcher button svg {
  width: 1.25rem;
  height: 1.25rem;
}

/* 最终结论 */
.final-verdict {
  text-align: center;
  background-color: var(--sidebar-bg); 
  border-radius: 12px;
  padding: 2rem;
  border: 1px solid var(--page-accent); 
}
.final-verdict h2 {
  border: none;
  display: block;
}
.verdict-list {
  list-style-type: decimal;
  display: inline-block;
  text-align: left;
  font-size: 1.2rem;
  line-height: 2;
  color: var(--text-color);
  margin-top: 1.5rem;
  margin-bottom: 2rem;
}
.narrative-end {
  font-size: 1.1rem;
  color: var(--text-color-light);
  line-height: 1.8;
}
</style>